import type { LanguageType } from "@generated/client";
import type { RepoDto } from "../dtos/Repo.dto";
import { findRecommendationByRepoAndLanguage, createRecommendation } from "../repositories/recommendation.repo";
import { logger } from "../utils/logger";
import { aiFetchingLock } from "../utils/lock";
import { generateRecommendationForRepo } from "../ai-api/ai-api";

/**
 * Prepare recommendation for a repository
 * If not in database, try to generate a new one using AI and store it
 * @param repoDto 
 * @param language preferred language
 * @returns recommendation string or null
 */
export async function prepareRecommendationForRepo(repoDto: RepoDto, language: LanguageType): Promise<string | null> {
    const servLogger = logger.child({repoId: repoDto.id, language});
    try {
        const maxRetries = 5;
        let delayMs = 1000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const recommendation = await findRecommendationByRepoAndLanguage(repoDto.id, language);
            if (recommendation) {
                servLogger.info("Recommendation retrived from database successfully");
                return recommendation.content;
            }
            servLogger.info(`No existing recommendation found, attempt ${attempt}/${maxRetries}`);
            const generatedRecommendation = await generateRecommendationWithLock(repoDto, language);
            if (generatedRecommendation) {
                createRecommendation(repoDto.id, language, generatedRecommendation);
                servLogger.info("Stored new recommendation successfully");
                return generatedRecommendation;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs += 1000;
        }
        servLogger.warn(`Recommendation not found after ${maxRetries} attempts`);
        return null;
    } catch (error) {
        servLogger.error({err: error}, "Error preparing recommendation");
        throw new Error(`Error preparing recommendation for repo ${repoDto.id} and language ${language}: ${error}`);
    }
}

/**
 * Generate recommendation with locking to prevent repeated AI API calls
 * @param repoDto 
 * @param language preferred language
 * @returns recommendation string or null
 */
export async function generateRecommendationWithLock(repoDto: RepoDto, language: LanguageType): Promise<string | null> {
    const servLogger = logger.child({repoId: repoDto.id, language});
    const lockKey = repoDto.id.toString() + `_${language}`;
    let locked = false;
    try {
        locked = aiFetchingLock.acquire(lockKey);
        if (locked) {
            const recommendation = await generateRecommendationForRepo(repoDto, language);
            servLogger.info("Generated new recommendation");
            return recommendation.recommendation!;
        }
        return null;
    } catch (error) {
        servLogger.error({err: error}, "Error generating recommendation with lock");
        return null;
    } finally {
        if (locked) {
            aiFetchingLock.release(lockKey);
        }
    }
}

/**
 * Get recommendation for a repository
 * @param repoId 
 * @param language preferred language
 * @returns recommendation string or null
 */
export async function getRecommendationForRepo(repoId: bigint, language: LanguageType): Promise<string | null> {
    try {
        const recommendation = await findRecommendationByRepoAndLanguage(repoId, language);
        return recommendation ? recommendation.content : null;
    } catch (error) {
        logger.error({err: error, repoId, language}, "Error fetching recommendation for repo");
        throw error;
    }
}

/**
 * Create recommendation for a repository
 * @param repoId 
 * @param language 
 * @param recommendation 
 */
export async function createRecommendationForRepo(repoId: bigint, language: LanguageType, recommendation: string): Promise<void> {
    try {
        await createRecommendation(repoId, language, recommendation);
        logger.info({repoId, language}, "Created recommendation for repo");
    } catch (error) {
        logger.error({err: error, repoId, language}, "Error creating recommendation for repo");
        throw error;
    }
}