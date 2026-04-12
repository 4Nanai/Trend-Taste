import type { SessionContext } from "@/bot";
import { enableTask } from "@/services/task.service";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";
import { Platform } from "@generated/enums";

export const command = "enable";
export const description = "Enables the scheduled task for target channel";
export const usage = "/enable <ChannelID> - Enable the scheduled task for target channel";
export async function execute(ctx: SessionContext) {
    const { channelId, channel, error } = await verifyChannelIdInput(ctx, usage)
    if (error) {
        logger.error({err: error}, "Failed to verify channel ID input for enable command");
        return;
    }
    const cmdLogger = logger.child({command: command, channelId: channelId})
    cmdLogger.info("Command invoked");
    try {
        await enableTask(channelId!, Platform.TELEGRAM);
        cmdLogger.info("Command executed successfully");
        return ctx.reply(`Enabled the scheduled task for channel <i>"${channel?.title}"</i>.`, {
            parse_mode: "HTML"
        });
    } catch (error) {
        cmdLogger.error({err: error}, "Command execution failed");
        return ctx.reply(`Failed to enable the scheduled task for channel <i>"${channel?.title}"</i>.`, {
            parse_mode: "HTML"
        });
    }
}
