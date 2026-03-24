import type { Context } from "grammy";
import { Platform } from "@generated/client";
import { createTask } from "@services/task.service";
import { logger } from "@utils/logger";
import type { ChatFullInfo } from "grammy/types";

export const command = "bind";
export const description = "/bind [channelID] - Bind a Telegram channel";

export async function execute(ctx: Context) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply("Usage: /bind <channelID>\nExample: /bind -1001234567890");
        return;
    }

    var channel: ChatFullInfo
    try {
        channel = await ctx.api.getChat(channelId);
    } catch (error) {
        await ctx.reply("Failed to bind this channelId. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        logger.error({ err: error }, "Error handling telegram bind command");
        return;   
    }
    if (!channel) {
        await ctx.reply("Channel not found. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        logger.error({ channelId }, "Error handling telegram bind command - channel not found");
        return;
    }
    await createTask(channelId, Platform.TELEGRAM);
    await ctx.reply(`Bound bot to channel \"${channel.title ?? channelId}\" successfully.`);
}
