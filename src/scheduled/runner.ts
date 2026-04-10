import { getTaskById } from "@services/task.service";
import { runGithubTrendingTask, runTelegramGithubTrendingTask } from "../tasks/github-trending";
import { discordClient, telegramBot } from "../bot";
import { logger } from "@utils/logger";
import { Platform } from "@generated/enums";

/**
 * Run the a task for the given taskId
 * @param taskId 
 * @returns void
 */
export async function runTask(taskId: number, platform: Platform = Platform.DISCORD): Promise<boolean> {
    if (platform == Platform.DISCORD && !discordClient) {
        logger.error("Discord client is not initialized");
        return false;
    }
    // check if platform is telegram
    if (platform == Platform.TELEGRAM && !telegramBot) {
        logger.error("Telegram bot is not initialized");
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
            if (platform == Platform.DISCORD && discordClient) {
                await runGithubTrendingTask(discordClient, task.channelId, task.language);
                runnerLogger.info("Github trending task completed");
            }
            if (platform == Platform.TELEGRAM && telegramBot) {
                await runTelegramGithubTrendingTask(telegramBot, task.channelId, task.language);
                runnerLogger.info("Github trending task completed");
            }
            break;
        }
        default: {
            runnerLogger.error("Unsupported task type");
            return false;
        }
    }
    return true;
}
