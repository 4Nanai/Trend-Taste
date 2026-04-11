import type { SessionContext } from "@/bot";
import { getTaskByChannelId } from "@/repositories/task.repo";
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
        await ctx.editMessageText(`Task type of channel <i>"${ctx.session.targetChannel?.title}"</i> set to Github Trending.`, {
            parse_mode: "HTML"
        });
    }
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
    let channelId = parts[1];
    let channel: ChatFullInfo | null = null;

    if (channelId && ctx.session.targetChannel && String(ctx.session.targetChannel.id) !== channelId) {
        await ctx.reply("A channel is already selected for language setting. Please complete the current language setting process before starting a new one.");
        return;
    }

    if (!channelId && ctx.session.targetChannel) {
        channel = ctx.session.targetChannel;
        channelId = String(channel.id);
    }

    if (!channelId) {
        await ctx.reply("Usage: /type <ChannelID>\nExample: /type -1001234567890");
        return;
    }

    // Check if the channel is already bound to a task
    try {
        const task = await getTaskByChannelId(channelId, Platform.TELEGRAM);
        if (!task) {
            await ctx.reply("Unbound channel. Please bind this channel first using /bind command before setting a task type.");
            return;
        }
    } catch (error) {
        await ctx.reply("Error retrieving task information for this channel. Please try again later.");
        logger.error({ err: error }, "Error handling telegram set-type command - error retrieving task information");
        return;
    }

    try {
        if (!channel) {
            channel = await ctx.api.getChat(channelId);
        }
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
    await ctx.reply(`Please select a task type for channel <i>"${channel.title}"</i>`, {
        reply_markup: typeMenu,
        parse_mode: "HTML",
    })
}
