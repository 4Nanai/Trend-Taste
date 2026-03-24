import type { UserHistoryDto } from "@/dtos/user-history.dto";
import type { SortedHistoryDto } from "@/dtos/sorted-history.dto";
import { InteractionType } from "@generated/client";
import { getUserHistoriesByUserId, upsertUserHistory } from "@repo/user-history.repo";

/**
 * Fetch user histories by user ID
 * @param userId 
 * @returns All user histories associated with the given user ID
 */
export async function fetchUserHistories(userId: string): Promise<UserHistoryDto[]> {
    try {
        const histories = await getUserHistoriesByUserId(userId);
        return histories;
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch sorted user histories by user ID
 * @param userId 
 * @returns Sorted user histories associated with the given user ID
 */
export async function fetchSortedUserHistories(userId: string): Promise<SortedHistoryDto> {
    try {
        const histories = await getUserHistoriesByUserId(userId);
        const pushedHistories = histories.filter(history => history.interactionType === InteractionType.PUSHED);
        const starredHistories = histories.filter(history => history.interactionType === InteractionType.STARRED);
        const likedHistories = histories.filter(history => history.interactionType === InteractionType.LIKED);
        const dislikedHistories = histories.filter(history => history.interactionType === InteractionType.DISLIKED);
        const sortedHistoryDto: SortedHistoryDto = {
            pushedHistories,
            starredHistories,
            likedHistories,
            dislikedHistories
        }
        return sortedHistoryDto;
    } catch (error) {
        throw error;
    }
}

/**
 * Record user interaction
 * @param userId 
 * @param repoId 
 * @param interactionType 
 * @returns The recorded user history entry
 */
export async function recordUserInteraction(userId: string, repoId: bigint, interactionType: InteractionType): Promise<UserHistoryDto> {
    try {
        const history = await upsertUserHistory(userId, repoId, interactionType);
        return history;
    } catch (error) {
        throw error;
    }
}