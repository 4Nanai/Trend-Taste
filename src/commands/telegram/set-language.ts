import { logger } from "@/utils/logger";
import type { Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import type { ChatFullInfo } from "grammy/types";

export const command = "language";
export const description = "/language [channelID] - Set the bot's reply language for a specific channel"

export const languageMenu = new Menu("language-menu")
    .text("English", (ctx) => {
        _setEnglish(ctx);
        ctx.menu.close();
        ctx.editMessageText("Language set to English.");
    })
    .row()
    .text("简体中文", (ctx) => {
        _setSimplifiedChinese(ctx);
        ctx.menu.close();
        ctx.editMessageText("语言已设置为简体中文。");
    });

export async function execute(ctx: Context) {
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

    await ctx.reply("Please select a language:", {
        reply_markup: languageMenu,
    });
}

async function _setEnglish(ctx: Context) {
    console.log("Set language to English");
}

async function _setSimplifiedChinese(ctx: Context) {
    console.log("Set language to Simplified Chinese");
}