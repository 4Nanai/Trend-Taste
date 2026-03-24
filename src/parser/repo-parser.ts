import type { RepoDto } from "../dtos/Repo.dto";
import type { RepoBasicDto } from "../dtos/RepoBasic.dto";
import { XMLParser } from "fast-xml-parser";
import { logger } from "@utils/logger";

/**
 * Parses the meta data of a repository
 * @param meta the raw meta data of the repository
 * @param repo the repository to overwrite
 * @returns the parsed repository
 */
export function parseRepoMeta(meta: any, repoBasicDto: RepoBasicDto): RepoDto {
    if (!meta) {
        throw new Error("Meta data is null");
    }
    const repoDto : RepoDto = {
        ...repoBasicDto,
        id: BigInt(meta.id),
        stars: meta.stargazers_count,
        forks: meta.forks,
        watchings: meta.subscribers_count,
        description: meta.description,
        topics: meta.topics,
        language: meta.language,
    };
    return repoDto;
}


/**
 * Parses the RSS data and returns a list of repositories
 * with owner, name, link, description
 * @param rssRawData the raw RSS data
 * @returns the list of repositories
 */
export function parseRepoListFromRSS(rssRawData: string): RepoBasicDto[] {
    // parse the rss raw data into rss xml data
    const parser = new XMLParser({
        ignoreAttributes: false,
    });
    const result = parser.parse(rssRawData);
    if (!result) {
        throw new Error("Failed to parse RSS data");
    }

    // parse the rss xml data into repo list
    const items = result.rss.channel.item;
    const repoList = items.map((item: any) => {
        const title = item.title;
        const link = item.link;
        const readme = item.description;
        const repoName = title.split("/");
        if (!repoName[0] || !repoName[1]) {
            return null;
        }

        const repo: RepoBasicDto = {
            owner: repoName[0],
            name: repoName[1],
            url: link,
            readme: readme,
        };
        return repo;
    }).filter((repo: RepoBasicDto | null) => repo !== null);
    logger.info({count: repoList.length}, `Parsed ${repoList.length} repositories from RSS data`);
    return repoList;
}
