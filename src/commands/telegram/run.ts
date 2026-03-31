import type { MyContext } from "@/bot";
import { logger } from "@/utils/logger";
import type { ChatFullInfo } from "grammy/types";

export const command = "run";
export const description = "/run <ChannelID> - Fetches the trending repositories from GitHub";

export async function execute(ctx: MyContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply("Usage: /run <ChannelID>\nExample: /run -1001234567890");
        return;
    }

    var channel: ChatFullInfo
    try {
        channel = await ctx.api.getChat(channelId);
    } catch (error) {
        await ctx.reply("Failed to find this channelId. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        logger.error({ err: error }, "Error handling telegram run command - invalid channelId");
        return;
    }
    if (!channel) {
        await ctx.reply("Channel not found. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        logger.error({ channelId }, "Error handling telegram run command - channel not found");
        return;
    }
}
