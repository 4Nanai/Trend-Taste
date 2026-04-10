import type { FineRepoDto } from "../dtos/FineRepo.dto";
import { type LanguageType } from "@generated/client";
import { logger } from "../utils/logger";
import { summaryFetchingLock } from "../utils/lock";
import { computeRepoGroupHash } from "../utils/repo-hash";
import { generateSummaryForRepoGroup } from "../ai-api/ai-api";
import { createSummary, getSummaryByRepoGroupHashAndLanguage } from "../repositories/summary.repo";

/**
 * Prepare a brief summary for the whole repo list
 * Retrieves from database
 * If not in database, generates a new one using AI and stores it
 * @param repoList 
 * @param language 
 * @returns summary string or null
 */
export async function prepareSummaryForRepoGroup(repoList: FineRepoDto[], language: LanguageType): Promise<string | null> {
    const repoGroupHash = computeRepoGroupHash(repoList.map(repo => repo.owner + "/" + repo.name));
    const servLogger = logger.child({repoGroupHash,language});
    try {
        const maxRetries = 5;
        let delayMs = 1000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const summary = await getSummaryByRepoGroupHashAndLanguage(repoGroupHash, language);
            if (summary) {
                servLogger.info("Summary retrieved from database successfully");
                return summary.content;
            }
            servLogger.info(`No existing summary found, attempt ${attempt}/${maxRetries}`);
            const generatedSummary = await generateSummaryWithLock(repoList, language);
            if (generatedSummary) {
                createSummary(repoGroupHash, repoList.map(repo => repo.owner + "/" + repo.name), language, generatedSummary);
                servLogger.info("Generated new summary successfully");
                return generatedSummary;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs += 1000;
        }
        servLogger.warn(`Summary not found after ${maxRetries} attempts`);
        return null;
    } catch (error) {
        servLogger.error({err: error}, "Error preparing summary");
        throw new Error(`Error preparing summary for repo group hash ${repoGroupHash} and language ${language}: ${error}`);
    }
}    

/**
 * Generate summary with locking to prevent concurrent repeated AI API calls
 * @param repoList 
 * @param language 
 * @returns summary string or null
 */
async function generateSummaryWithLock(repoList: FineRepoDto[], language: LanguageType): Promise<string | null> {
    const lockKey = computeRepoGroupHash(repoList.map(repo => repo.owner + "/" + repo.name));
    const servLogger = logger.child({repoGroupHash: lockKey, language});
    let locked = false;
    try {
        locked = summaryFetchingLock.acquire(lockKey);
        if (locked) {
            const summary = await generateSummaryForRepoGroup(repoList, language);
            servLogger.info("Generated new summary");
            return summary;
        }
        return null;
    } catch (error) {
        servLogger.error({err: error}, "Error generating summary with lock");
        return null
    } finally {
        if (locked) {
            summaryFetchingLock.release(lockKey);
        }
    }
}
