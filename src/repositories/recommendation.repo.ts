import type { LanguageType } from "@generated/client";
import { prisma } from "@db";

export async function findRecommendationByRepoAndLanguage(repoId: bigint, language: LanguageType) {
    return prisma.recommendation.findUnique({
        where: {
            repoId_language: {
                repoId: repoId,
                language: language,
            }
        }
    });
}

export async function createRecommendation(repoId: bigint, language: LanguageType, recommendation: string) {
    return prisma.recommendation.create({
        data: {
            repoId: repoId,
            language: language,
            content: recommendation,
        }
    });
}
