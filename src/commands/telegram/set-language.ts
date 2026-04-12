import { logger } from "@/utils/logger";
import { Menu } from "@grammyjs/menu";
import type { SessionContext } from "@/bot";
import { setTaskLanguage } from "@/services/task.service";
import { LanguageType, Platform } from "@generated/enums";
import { verifyChannelIdInput } from "@/utils/telegram";

export const command = "language";
export const description = "/language <ChannelID> - Set the bot's reply language for a specific channel"
export const usage = "/language <ChannelID>\nExample: /language -1001234567890"

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
    const { channel, error } = await verifyChannelIdInput(ctx) 
    if (!channel || error) {
        logger.error({err: error}, "Failed to verify channel ID input");
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
