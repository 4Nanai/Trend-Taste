import { logger } from "@/utils/logger";
import type { Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import type { ChatFullInfo } from "grammy/types";
import type { SessionContext } from "@/bot";
import { setTaskLanguage } from "@/services/task.service";
import { LanguageType, Platform } from "@generated/enums";
import { MessageFlags } from "discord.js";

export const command = "language";
export const description = "/language <ChannelID> - Set the bot's reply language for a specific channel"

export const languageMenu = new Menu<SessionContext>("language-menu")
    .text("English", async (ctx) => {
        const error = await _setEnglish(ctx);
        ctx.menu.close();
        if (error) {
            await ctx.editMessageText(`Error: ${error.message}`);
        } else {
            await ctx.editMessageText(`Language of channel ${ctx.session.targetChannel?.title} set to English.`);
        }
        ctx.session.targetChannel = null;
    })
    .row()
    .text("简体中文", async (ctx) => {
        const error = await _setSimplifiedChinese(ctx);
        ctx.menu.close();
        if (error) {
            await ctx.editMessageText(`Error: ${error.message}`);
        } else {
            await ctx.editMessageText(`频道 ${ctx.session.targetChannel?.title} 的推送语言已设置为简体中文。`);
        }
        ctx.session.targetChannel = null;
    });

export async function execute(ctx: SessionContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply("Usage: /language <ChannelID>\nExample: /language -1001234567890");
        return;
    }

    if (ctx.session.targetChannel) {
        await ctx.reply("A channel is already selected for language setting. Please complete the current language setting process before starting a new one.");
        return;
    }

    var channel: ChatFullInfo
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
    await ctx.reply("Please select a language:", {
        reply_markup: languageMenu,
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
        await setTaskLanguage(String(channel.id), LanguageType.EN);
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
