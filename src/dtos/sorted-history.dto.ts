import type { UserHistoryDto } from "./user-history.dto";

export type SortedHistoryDto = {
    pushedHistories: UserHistoryDto[];
    starredHistories: UserHistoryDto[];
    likedHistories: UserHistoryDto[];
    dislikedHistories: UserHistoryDto[];
}