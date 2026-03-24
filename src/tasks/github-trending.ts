import type { RepoDto } from "../dtos/Repo.dto";
import type { FineRepoDto } from "../dtos/FineRepo.dto";
import type { LanguageType } from "@generated/client";
import type { MessageCreateOptions } from "discord.js";
import pLimit from 'p-limit';
import { ActionRowBuilder, ButtonStyle, Client, EmbedBuilder, ButtonBuilder } from "discord.js";
import { parseRepoListFromRSS } from "../parser/repo-parser";
import { fetchGithubTrending } from "@utils/github-rss-api";
import { logger } from "@utils/logger";
import { prepareRepo } from "@services/repo.service";
import { prepareRecommendationForRepo } from "@services/recommendation.service";
import { prepareSummaryForRepoGroup } from "@services/summary.service";


/**
 * Runs the github trending task
 * 1. Get trending repositories from github rss api
 *    Prepare them with meta information from github api
 * 2. Prepare recommendations based on AI to the repo list
 * 3. Prepare a brief summary for the whole repo list
 * 4. Build their embed format
 * 5. Pushes the embed message to the channel
 * @param client discord client
 */
export async function runGithubTrendingTask(client: Client, channelId: string, language: LanguageType) {
    try {
        const repoList = await prepareTrendingRepos();
        const fineRepoList = await prepareFineRepoList(repoList, language);
        const summary = await prepareSummary(fineRepoList, language);

        const embedSummary = formatSummaryToEmbed(summary);
        const messageRepo: MessageCreateOptions[] = fineRepoList.map(fineRepo => ({embeds: [formatRepoToEmbed(fineRepo)], components: [buildButtons(fineRepo)]}));

        await pushSummaryToChannel(client, channelId, embedSummary);
        await pushTrendingToChannel(client, channelId, messageRepo);
    } catch (error) {
        logger.error({err: error}, "Error running github trending task");
        throw error;
    }
}

/**
 * Prepare a brief summary for the whole repo list
 * @param repoList 
 * @returns summary string
 */
async function prepareSummary(repoList: FineRepoDto[], language: LanguageType): Promise<string> {
    const summary = await prepareSummaryForRepoGroup(repoList, language);
    if (!summary) {
        logger.error("Failed to prepare summary for repo group");
        throw new Error("Failed to prepare summary for repo group");
    }
    logger.info("Prepared summary for trending repositories");
    return summary;
}

/**
 * Add recommendations based on AI to the repo list
 * @param repoList repo list with basic information
 * @returns repo list with recommendations
 */
async function prepareFineRepoList(repoList: RepoDto[], language: LanguageType): Promise<FineRepoDto[]> {
    const limit = pLimit(5); // limit concurrency to 5
    const input = repoList.map(repo => {
        return limit(async () => {
            const recommendation = await prepareRecommendationForRepo(repo, language);
            return {
                ...repo,
                recommendation: recommendation || "No recommendation available"
            } as FineRepoDto;
        });
    });
    const fineRepoList = await Promise.all(input);
    logger.info({count: fineRepoList.length}, `Prepared recommendations for ${fineRepoList.length}/${repoList.length} repositories`);
    return fineRepoList;
}

/**
 * Get trending repositories from github rss api
 * Prepare them with meta information from github api
 * @returns repo list
 */
async function prepareTrendingRepos(): Promise<RepoDto[]> {
    const rssData = await fetchGithubTrending();
    const repoList = parseRepoListFromRSS(rssData);

    const limit = pLimit(5); // limit concurrency to 5
    const input = repoList.map(repoBasicDto => {
        return limit(async () => {
            const repo = await prepareRepo(repoBasicDto);
            if (!repo) {
                return null;
            }
            return {
                ...repo,
                readme: repoBasicDto.readme
            };
        }
    )});
    const repoDtoList = await Promise.all(input);
    const filteredRepoDtoList = repoDtoList.filter( repo => repo !== null) as RepoDto[];
    logger.info({count: filteredRepoDtoList.length}, `Prepared ${filteredRepoDtoList.length} trending repositories`);
    return filteredRepoDtoList;
}

/**
 * Pushes the trending repositories to the channel
 * @param client discord client
 * @param repoList repo list
 */
export async function pushTrendingToChannel(client: Client, channelId: string, messages: MessageCreateOptions[]) {
    try {

        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('send' in channel)) {
            throw new Error("Channel not found or not text based");
        }
        await Promise.all(messages.map(async (message) => {
            await channel.send(message);
        }));
        logger.info({channelId}, "Pushed trending repositories to channel successfully");
    } catch (error) {
        logger.error({err: error, channelId}, "Error pushing trending repositories to channel");
    }
}

/**
 * Pushes the summary to the channel
 * @param client discord client
 * @param summary summary string
 */
async function pushSummaryToChannel(client: Client, channelId: string, summary: EmbedBuilder) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('send' in channel)) {
            throw new Error("Channel not found or not text based");
        }
        await channel.send({ embeds: [summary] });
        logger.info({channelId}, "Pushed summary to channel successfully");
    } catch (error) {
        logger.error({err: error, channelId}, "Error pushing summary to channel");
    }
}

/**
 * Formats the summary to an embed
 * @param summary summary string 
 * @returns embed
 */
function formatSummaryToEmbed(summary: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: 'Trend-Taste bot', 
            iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            url: 'https://github.com/yyxff/Trend-Taste'
        })
        .setColor(0x00FF00)
        .setTitle('Trending Repositories Summary')
        .setDescription(summary)
        .setTimestamp()
        .setFooter({ text: 'Trend Taste', iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' });
    return embed;
}

/**
 * Formats the repo list to an embed
 * @param repoList repo list
 * @returns embed
*/
export function formatRepoToEmbed(repo: FineRepoDto): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${repo.owner}/${repo.name}`)
        .setURL(repo.url)
        .setTimestamp()
        .setFooter({ text: 'Trend Taste', iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' });


    const meta = `⭐ ${repo.stars || 0} | 𐂐 ${repo.forks || 0} | 👀 ${repo.watchings || 0} | </> ${repo.language || 'Unknown'}`;
    const description = repo.description ? (repo.description.length > 200 ? repo.description.substring(0, 200) + '...' : repo.description) : 'No description';
    const recommendation = repo.recommendation.substring(0, 1000);

    embed.addFields({ name: 'Stat', value: meta });
    embed.addFields({ name: 'Description', value: description });
    embed.addFields({ name: 'Recommendation', value: recommendation });
    // this image service is a 3rd-party one(https://github.com/miantiao-me/github-og-image)
    // thus it can be unstable
    embed.setImage(`https://github.html.zone/${repo.owner}/${repo.name}`)

    return embed;
}

/**
 * Builds the action row with like and dislike buttons with custom IDs
 * @param fineRepoDto 
 * @returns 
 */
export function buildButtons(fineRepoDto: FineRepoDto): ActionRowBuilder<ButtonBuilder> {
    const feedbackButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`like/${fineRepoDto.id}`)
                .setEmoji('👍')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`dislike/${fineRepoDto.id}`)
                .setEmoji('👎')
                .setStyle(ButtonStyle.Secondary),
        );
    return feedbackButtons;
}
