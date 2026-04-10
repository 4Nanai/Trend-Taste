import { generate } from "./gemini";
import { summary, type RepoDto } from "../dtos/Repo.dto";
import type { FineRepoDto } from "../dtos/FineRepo.dto";
import { LanguageType } from "@generated/client";
import { languagePromptMap } from "../constants/language";

/**
 * Generate recommendation for a repository
 * @param repo 
 * @param language preferred language
 * @returns FineRepoDto with recommendation
 */
export async function generateRecommendationForRepo(repo: RepoDto, language: LanguageType): Promise<FineRepoDto> {
    const prompt = `${languagePromptMap[language]}. `
    +`Please give me a brief recommendation (within 50 words) for this repository: `
    +`${summary(repo)}, ${repo.readme?.substring(0, 1500)}`;
    const recommendation = await generate(prompt);
    return {
        ...repo,
        recommendation: recommendation
    };
}

/**
 * Generate summary for a repo group
 * @param repoList 
 * @param language 
 * @returns summary string
 */
export async function generateSummaryForRepoGroup(repoList: FineRepoDto[], language: LanguageType): Promise<string> {
    const repoRecommendations = repoList.map(repo => repo.recommendation).join('\n');
    const prompt = `${languagePromptMap[language]}. Please give me a brief summary (within 100 words for the whole summary! You only need to include the most valuable information) for today's repositories: ${repoRecommendations}`;
    const summary = await generate(prompt);
    return summary;
}
