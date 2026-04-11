import type { SessionContext } from "@/bot";
import { runTask } from "@/scheduled/runner";
import { getTaskByChannelId } from "@/services/task.service";
import { logger } from "@/utils/logger";
import { Platform } from "@generated/enums";

export const command = "run";
export const description = "/run <ChannelID> - Fetches the trending repositories from GitHub";

export async function execute(ctx: SessionContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply("Usage: /run <ChannelID>\nExample: /run -1001234567890");
        return;
    }
    const cmdLogger = logger.child({ command: `/${command}`, channelId: channelId });
    cmdLogger.info("Command invoked");
    try {
        const task = await getTaskByChannelId(channelId, Platform.TELEGRAM);
        if (!task) {
            cmdLogger.warn("No task configured for this channel");
            return ctx.reply("No task configured for this channel. Please set up a task first by /set-type.");
        }
        runTask(task.id, Platform.TELEGRAM);
        cmdLogger.info({ taskType: task.taskType }, "Task started successfully");
        return ctx.reply(`Task ${task.taskType} started. Check the channel for results shortly.`);
    } catch (error) {
        cmdLogger.error({err: error}, "Error in running task");
        return ctx.reply("Error retrieving task configuration. Please try again later.");
    }
}
