import { Platform } from "@generated/client";
import { createTask } from "@services/task.service";
import { logger } from "@utils/logger";
import type { ChatFullInfo } from "grammy/types";
import type { SessionContext } from "@/bot";

export const command = "bind";
export const description = "/bind <ChannelID> - Bind a Telegram channel";
export const usage = "Usage: /bind <ChannelID>\nExample: /bind -1001234567890";

export async function execute(ctx: SessionContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply(usage);
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
    // Store the bound channel in session
    ctx.session.targetChannel = channel;
    await ctx.reply(`Bound bot to channel \"${channel.title ?? channelId}\" successfully.`);
}
