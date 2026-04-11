import { logger } from "@/utils/logger";
import { Menu } from "@grammyjs/menu";
import type { ChatFullInfo } from "grammy/types";
import type { SessionContext } from "@/bot";
import { setTaskLanguage } from "@/services/task.service";
import { LanguageType, Platform } from "@generated/enums";
import { getTaskByChannelId } from "@/repositories/task.repo";

export const command = "language";
export const description = "/language <ChannelID> - Set the bot's reply language for a specific channel"

export const languageMenu = new Menu<SessionContext>("language-menu")
    .text("English", async (ctx) => {
        const error = await _setEnglish(ctx);
        ctx.menu.close();
        if (error) {
            await ctx.editMessageText(`Error: ${error.message}`);
        } else {
            await ctx.editMessageText(`Language of channel <i>"${ctx.session.targetChannel?.title}"</i> set to English.`, {
                parse_mode: "HTML"
            });
        }
    })
    .row()
    .text("简体中文", async (ctx) => {
        const error = await _setSimplifiedChinese(ctx);
        ctx.menu.close();
        if (error) {
            await ctx.editMessageText(`Error: ${error.message}`);
        } else {
            await ctx.editMessageText(`频道 <i>"${ctx.session.targetChannel?.title}"</i> 的推送语言已设置为简体中文。`, {
                parse_mode: "HTML"
            });
        }
    });

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
        await ctx.reply("Usage: /language <ChannelID>\nExample: /language -1001234567890");
        return;
    }

    try {
        const task = await getTaskByChannelId(channelId, Platform.TELEGRAM);
        if (!task) {
            await ctx.reply("No task configured for this channel. Please set up a task first by /set-type.");
            logger.warn({ channelId }, "No task configured for this channel when setting language");
            return;
        }
    } catch (error) {
        await ctx.reply("Error retrieving task configuration for this channel. Please try again later.");
        logger.error({ err: error, channelId }, "Error retrieving task configuration when setting language");
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
    await ctx.reply(`Please select a language for channel <i>"${channel.title}"</i>:`, {
        reply_markup: languageMenu,
        parse_mode: "HTML",
    });
}

async function _setEnglish(ctx: SessionContext): Promise<Error | null> {
    const channel = ctx.session.targetChannel;
    if (!channel) {
        logger.error("No target channel found in session when setting language");
        return new Error("No target channel found in session");
    }
    const cmdLogger = logger.child({command: `/${command}}`, channelId: channel.id})
    cmdLogger.info("Command invoked");

    try {
        await setTaskLanguage(String(channel.id), LanguageType.EN, Platform.TELEGRAM);
        cmdLogger.info("Command executed successfully");
        return null;
    } catch (error) {
        cmdLogger.error({err: error}, "Command execution failed");
        return new Error(`Failed to set language for channel ${channel.title}. Please try again later.`);
    }
}

async function _setSimplifiedChinese(ctx: SessionContext): Promise<Error | null> {
    const channel = ctx.session.targetChannel;
    if (!channel) {

        logger.error("No target channel found in session when setting language");
        return new Error("No target channel found in session");
    }
    const cmdLogger = logger.child({command: `/${command}}`, channelId: channel?.id})
    cmdLogger.info("Command invoked");

    try {
        await setTaskLanguage(String(channel.id), LanguageType.ZH, Platform.TELEGRAM);
        cmdLogger.info("Command executed successfully");
        return null;
    } catch (error) {
        cmdLogger.error({err: error}, "Command execution failed");
        return new Error(`Failed to set language for channel ${channel.title}. Please try again later.`);
    }
}
