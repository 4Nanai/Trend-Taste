import type { SessionContext } from "@/bot";
import { setTaskType } from "@/services/task.service";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";
import { Platform, TaskType } from "@generated/enums";
import { Menu } from "@grammyjs/menu"

export const command = "type"
export const description = "/type [ChannelID] - Sets the task type of this channel"
export const usage = "/type <ChannelID>\nExample: /type -1001234567890"

export const typeMenu = new Menu<SessionContext>("type-menu").text("Github Trending", async (ctx) => {
    const error = await _setGithubTreading(ctx);
    ctx.menu.close();
    if (error) {
        await ctx.editMessageText(`Error: ${error.message}`);
        return;
    } 
    await ctx.editMessageText(`Task type of channel <i>"${ctx.session.targetChannel?.title}"</i> set to Github Trending.`, {
        parse_mode: "HTML"
    });
    ctx.session.cmdLogger = null;
})

async function _setGithubTreading(ctx: SessionContext): Promise<Error | null> {
    const channel = ctx.session.targetChannel;
    if (!channel) {
        logger.error("No target channel in session when setting task type");
        return new Error("No target channel in session."); 
    }
    try {
        await setTaskType(String(channel.id), TaskType.GITHUB_TRENDING, Platform.TELEGRAM);
        ctx.session.cmdLogger?.info("Task type set to Github Trending successfully");
        return null;
    } catch (error) {
        ctx.session.cmdLogger?.error({err: error}, "Error setting task type");
        return new Error("Failed to set task type. Please try again later.");
    }
}

export async function execute(ctx: SessionContext) {
    const { channelId, channel, error } = await verifyChannelIdInput(ctx, usage);
    if (error) {
        logger.error({err: error}, "Failed to verify channel ID input for type command");
        return;
    }
    ctx.session.targetChannel = channel;
    ctx.session.cmdLogger = logger.child({command: command, channelId: channelId})
    ctx.session.cmdLogger.info("Command invoked");
    await ctx.reply(`Please select a task type for channel <i>"${channel!.title}"</i>`, {
        reply_markup: typeMenu,
        parse_mode: "HTML",
    })
}
