import type { SessionContext } from "@/bot";
import { disableTask } from "@/services/task.service";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";
import { Platform } from "@generated/enums";

export const command = "disable";
export const description = "Disables the scheduled task for target channel";
export const usage = "/disable <ChannelID> - Disable the scheduled task for target channel";

export async function execute(ctx: SessionContext) {
    const { channelId, channel, error } = await verifyChannelIdInput(ctx, usage)
    if (error) {
        return;
    }
    const cmdLogger = logger.child({command: command, channelId: channelId})
    cmdLogger.info("Command invoked");
    try {
        await disableTask(channelId!, Platform.TELEGRAM);
        cmdLogger.info("Command executed successfully");
        return ctx.reply(`Disabled the scheduled task for channel <i>"${channel?.title}"</i>.`);
    } catch (error) {
        cmdLogger.error({err: error}, "Command execution failed");
        return ctx.reply(`Failed to disable the scheduled task for channel <i>"${channel?.title}"</i>.`);
    }
}
