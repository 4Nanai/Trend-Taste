import { logger } from "@/utils/logger";
import type { Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import type { ChatFullInfo } from "grammy/types";
import type { MyContext } from "@/bot";
import { setTaskLanguage } from "@/services/task.service";
import { LanguageType } from "@generated/enums";
import { MessageFlags } from "discord.js";

export const command = "language";
export const description = "/language [channelID] - Set the bot's reply language for a specific channel"

export const languageMenu = new Menu<MyContext>("language-menu")
    .text("English", async (ctx) => {
        await _setEnglish(ctx);
        ctx.menu.close();
        await ctx.editMessageText("Language set to English.");
    })
    .row()
    .text("简体中文", async (ctx) => {
        await _setSimplifiedChinese(ctx);
        ctx.menu.close();
        await ctx.editMessageText("语言已设置为简体中文。");
    });

export async function execute(ctx: MyContext) {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    const channelId = parts[1];

    if (!channelId) {
        await ctx.reply("Usage: /language <channelID>\nExample: /language -1001234567890");
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

async function _setEnglish(ctx: MyContext) {
    const channel = ctx.session.targetChannel;
    if (!channel) {
        await ctx.reply("No target channel found in session. Please try the command again.");
        logger.error("No target channel found in session when setting language");
        return;
    }
    const cmdLogger = logger.child({command: `/${command}}`, channelId: channel.id})
    cmdLogger.info("Command invoked");

    try {
        await setTaskLanguage(String(channel.id), LanguageType.EN);
        cmdLogger.info("Command executed successfully");
        await ctx.reply(`Language has been set to English for channel ${channel.title}`);
    } catch (error) {
        cmdLogger.error({err: error}, "Command execution failed");
        await ctx.reply(`Failed to set language for channel ${channel.title}.`);
    }

    ctx.session.targetChannel = null;
}

async function _setSimplifiedChinese(ctx: MyContext) {
    const channel = ctx.session.targetChannel;
    if (!channel) {
        await ctx.reply("No target channel found in session. Please try the command again.");
        logger.error("No target channel found in session when setting language");
        return;
    }
    const cmdLogger = logger.child({command: `/${command}}`, channelId: channel?.id})
    cmdLogger.info("Command invoked");

    try {
        await setTaskLanguage(String(channel.id), LanguageType.ZH);
        cmdLogger.info("Command executed successfully");
        await ctx.reply(`Language has been set to Simplified Chinese for channel ${channel.title}`);
    } catch (error) {
        cmdLogger.error({err: error}, "Command execution failed");
        await ctx.reply(`Failed to set language for channel ${channel.title}.`);
    }
    ctx.session.targetChannel = null;
}