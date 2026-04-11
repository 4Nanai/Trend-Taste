import type { SessionContext } from "@/bot";
import { runTask } from "@/scheduled/runner";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";
import { Platform } from "@generated/enums";

export const command = "run";
export const description = "/run <ChannelID> - Fetches the trending repositories from GitHub";
export const usage = "/run <ChannelID>\nExample: /run -1001234567890"

export async function execute(ctx: SessionContext) {
    const { channelId, task } = await verifyChannelIdInput(ctx)
    if (!task || !channelId) {
        return;
    }
    const cmdLogger = logger.child({ command: `/${command}`, channelId: channelId });
    cmdLogger.info("Command invoked");
    try {
       runTask(task.id, Platform.TELEGRAM);
        cmdLogger.info({ taskType: task.taskType }, "Task started successfully");
        return ctx.reply(`Task ${task.taskType} started. Check the channel for results shortly.`);
    } catch (error) {
        cmdLogger.error({err: error}, "Error in running task");
        return ctx.reply("Error retrieving task configuration. Please try again later.");
    }
}
