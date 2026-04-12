import type { SessionContext } from "@/bot";
import { runTask } from "@/scheduled/runner";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";
import type { Task } from "@generated/client";
import { Platform } from "@generated/enums";

export const command = "run";
export const description = "/run <ChannelID> - Fetches the trending repositories from GitHub";
export const usage = "/run <ChannelID>\nExample: /run -1001234567890"

export async function execute(ctx: SessionContext) {
    const { channelId, task, error } = await verifyChannelIdInput(ctx)
    if (error) {
        return;
    }
    const cmdLogger = logger.child({ command: `/${command}`, channelId: channelId });
    cmdLogger.info("Command invoked");
    const [isValid, errMessage] = checkTaskRequirements(task!)
    if (!isValid) {
        cmdLogger.error({ err: errMessage }, "Task configuration validation failed");
        return ctx.reply(`Task configuration error: ${errMessage}`);
    }
    if (errMessage) {
        ctx.reply(`Warning: ${errMessage}`);
    }
    try {
        runTask(task!.id, Platform.TELEGRAM);
        cmdLogger.info({ taskType: task!.taskType }, "Task started successfully");
        return ctx.reply(`Task ${task!.taskType} started. Check the channel for results shortly.`);
    } catch (error) {
        cmdLogger.error({err: error}, "Error in running task");
        return ctx.reply("Error retrieving task configuration. Please try again later.");
    }
}

function checkTaskRequirements(task: Task): [boolean, string?] {
    if (!task.taskType) {
        return [false, "Task type is not defined."];
    }
    if (!task.language) {
        return [false, "Task language is not defined."];
    }
    if (!task.schedule) {
        return [true, "Task schedule is not defined."];
    }
    return [true];
}
