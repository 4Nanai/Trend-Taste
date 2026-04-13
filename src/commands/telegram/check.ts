import type { SessionContext } from "@/bot";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";

export const command = "check";
export const description = "/check <ChannelId> - Check the current task configuration for the specified channel.";
export const usage = "/check <ChannelID> - Check the current task configuration for the specified channel. You can use this command to verify the channel ID and see if a task is already configured for that channel. Example: /check -1001234567890";

export async function execute(ctx: SessionContext) {
    const { channelId, channel, task, error } = await verifyChannelIdInput(ctx, usage);
    if (error) {
        return;
    }
    const cmdLogger = logger.child({ command, channelId });
    cmdLogger.info("Command invoked");
    try {
        const taskReady = task!.taskType && task!.language && task!.schedule && task!.timezone;
        const allDoneFlag = taskReady && task!.enabled;
        const taskInfo = `<strong>Task Configuration Check List:</strong>\n`
            +`· ${task!.taskType? "✅ " : "❌ "}<strong>[Task Type]</strong>: ${task!.taskType || "Not set"}\n`
            +`· ${task!.language? "✅ " : "❌ "}<strong>[Language]</strong>: ${task!.language || "Not set"}\n`
            +`· ${task!.schedule? "✅ " : "❌ "}<strong>[Schedule]</strong>: ${task!.schedule ? task!.schedule.getUTCHours().toString().padStart(2, '0') + ":" + task!.schedule.getUTCMinutes().toString().padStart(2, '0') : "Not set"}\n`
            +`· ${task!.timezone? "✅ " : "❌ "}<strong>[Timezone]</strong>: ${task!.timezone || "Not set"}\n`
            // +`· ${taskReady? "✅ " : "❌ "}<strong>[Ready to enable]</strong>: ${taskReady ? "Yes" : "No"}\n`
            +`· ${task!.enabled? "✅ " : "❌ "}<strong>[Enabled]</strong>: ${task!.enabled ? "Yes" : "No"}\n`
            +`\n<strong>${allDoneFlag ? "All set! Your task is fully configured and enabled!" : "Please complete the missing configurations to enable the scheduled task."}</strong>`
            +`${task!.taskType? "" : "\n· Use <code>/type</code> to set the task type."}`
            +`${task!.language? "" : "\n· Use <code>/language</code> to set the language."}`
            +`${task!.schedule? "" : "\n· Use <code>/schedule</code> to set the schedule."}`
            +`${task!.enabled? "" : "\n· Use <code>/enable</code> to enable the task once all configurations are set."}`;
        return ctx.reply(taskInfo, { parse_mode: "HTML" });
    } catch (error) {
        cmdLogger.error({err: error}, "Error in check command");
        return ctx.reply("Error retrieving task information. Please try again later.");
    }
}
