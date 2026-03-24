import { getTaskById } from "@services/task.service";
import { runGithubTrendingTask } from "../tasks/github-trending";
import { discordClient } from "../bot";
import { logger } from "@utils/logger";

/**
 * Run the a task for the given taskId
 * @param taskId 
 * @returns void
 */
export async function runTask(taskId: number): Promise<boolean> {
    if (!discordClient) {
        logger.error("Discord client is not initialized");
        return false;
    }
    const runnerLogger = logger.child({taskId});
    const task = await getTaskById(taskId);
    if (!task) {
        runnerLogger.error("No task found for taskId:");
        return false;
    }
    switch (task.taskType) {
        case 'GITHUB_TRENDING': {
            await runGithubTrendingTask(discordClient, task.channelId, task.language);
            runnerLogger.info("Github trending task completed");
            break;
        }
        default: {
            runnerLogger.error("Unsupported task type");
            return false;
        }
    }
    return true;
}