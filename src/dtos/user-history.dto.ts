import type { UserHistory } from "@generated/client";

export type UserHistoryDto = Omit<UserHistory, "id">;