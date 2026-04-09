import type { SessionContext } from "@/bot";
import { setTaskType } from "@/services/task.service";
import { logger } from "@/utils/logger";
import { Platform, TaskType } from "@generated/enums";
import { Menu } from "@grammyjs/menu"
import type { ChatFullInfo } from "grammy/types";

export const command = "type"
export const description = "/type [ChannelID] - Sets the task type of this channel"

export const typeMenu = new Menu<SessionContext>("type-menu").text("Github Trending", async (ctx) => {
    const error = await _setGithubTreading(ctx);
    ctx.menu.close();
    if (error) {
        await ctx.editMessageText(`Error: ${error.message}`);
    } else {
        await ctx.editMessageText(`Task type of channel ${ctx.session.targetChannel?.title} set to Github Trending.`);
    }
    ctx.session.targetChannel = null;
})

async function _setGithubTreading(ctx: SessionContext): Promise<Error | null> {
    const channel = ctx.session.targetChannel;
    if (!channel) {
        logger.error("No target channel in session when setting task type");
        return new Error("No target channel in session."); 
    }
    const cmdLogger = logger.child({command: "set-type", channelId: channel?.id})
    cmdLogger.info("Setting type command invoked");
    try {
        await setTaskType(String(channel.id), TaskType.GITHUB_TRENDING, Platform.TELEGRAM);
        return null;
    } catch (error) {
        cmdLogger.error({err: error}, "Error setting task type");
        return new Error("Failed to set task type. Please try again later.");
    }
}

export async function execute(ctx: SessionContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];
    if (!channelId) {
        await ctx.reply("Usage: /type <ChannelID>\nExample: /type -1001234567890");
        return;
    }
    if (ctx.session.targetChannel) {
        await ctx.reply("A channel is already selected for language setting. Please complete the current language setting process before starting a new one.");
        return;
    }

    var channel: ChatFullInfo;
    try {
        channel = await ctx.api.getChat(channelId);
    } catch (error) {
        await ctx.reply("Failed to find this channelId. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        logger.error({ err: error }, "Error handling telegram set-language command - invalid channelId");
        return;
    }
    if (!channel) {
        await ctx.reply("Channel not found. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        logger.error({ channelId }, "Error handling telegram set-language command - channel not found");
        return;
    }

    ctx.session.targetChannel = channel;
    await ctx.reply("Please select a task type:", {
        reply_markup: typeMenu,
    })
}
