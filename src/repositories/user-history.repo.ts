import type { UserHistoryDto } from "@dtos/user-history.dto";
import { InteractionType } from "@generated/client";
import { prisma } from "@db";

export async function getUserHistoriesByUserId(userId: string): Promise<UserHistoryDto[]> {
    return prisma.userHistory.findMany({
        where: {
            userId: BigInt(userId)
        }
    });
}

export async function upsertUserHistory(userId: string, repoId: bigint, interactionType: InteractionType): Promise<UserHistoryDto> {
    return prisma.userHistory.upsert({
        where: {
            userId_repoId: {
                userId: BigInt(userId),
                repoId: repoId,
            }
        },
        create: {
            userId: BigInt(userId),
            repoId: repoId,
            interactionType: interactionType,
        },
        update: {
            interactionType: interactionType,
        }
    });
}