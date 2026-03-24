import type { Context } from "grammy";

export const command = "help";
export const description = "List available commands";

export async function execute(ctx: Context) {
    await ctx.reply(
        "Available commands:\n"
        + "/help - Show this help message\n"
        + "/hello - Say hello to the bot\n"
        + "/bind <channelId> - Bind a Telegram channel/chat ID\n"
        + "/unbind <channelId> - Unbind a Telegram channel/chat ID"
    );
}
