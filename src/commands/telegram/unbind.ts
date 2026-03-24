import type { Context } from "grammy";
import { Platform } from "@generated/client";
import { unbindTask } from "@services/task.service";
import { logger } from "@utils/logger";
import type { ChatFullInfo } from "grammy/types";

export const command = "unbind";
export const description = "/unbind [channelID] - Unbind a Telegram channel";

export async function execute(ctx: Context) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply("Usage: /unbind <channelID>\nExample: /unbind -1001234567890");
        return;
    }

    var channel: ChatFullInfo

    try {
        channel = await ctx.api.getChat(channelId);
    } catch (error) {
        await ctx.reply("Failed to unbind this channelID. Please make sure the channelId is correct.");
        logger.error({ err: error }, "Error handling telegram unbind command - invalid channelId");
        return;
    }
    if (!channel) {
        await ctx.reply("Channel not found. Please make sure the channelId is correct.");
        logger.error({ channelId }, "Error handling telegram bind command - channel not found");
        return;
    }
    await unbindTask(channelId, Platform.TELEGRAM);
    await ctx.reply(`Unbound bot from channel \"${channel.title ?? channelId}\" successfully.`);
}
