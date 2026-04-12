import { Platform } from "@generated/client";
import { unbindTask } from "@services/task.service";
import { logger } from "@utils/logger";
import type { SessionContext } from "@/bot";

export const command = "unbind";
export const description = "/unbind <ChannelID> - Unbind a Telegram channel";
export const usage = "Usage: /unbind <ChannelID>\nExample: /unbind -1001234567890"

export async function execute(ctx: SessionContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply(usage);
        return;
    }

    try {
        await unbindTask(channelId, Platform.TELEGRAM);
    } catch (error) {
        await ctx.reply("Failed to unbind this ChannelID. Please make sure the ChannelID is correct.");
        logger.error({ err: error }, "Error handling telegram unbind command - invalid ChannelID");
        return;
    }
    // Clear target channel in session
    if (ctx.session.targetChannel && String(ctx.session.targetChannel.id) === channelId) {
        ctx.session.targetChannel = null;
    }
    await ctx.reply(`Successfully unbound channel.`);
}
