import type { Context } from "grammy";

export const command = "hello";
export const description = "Say hello to the bot";

export async function execute(ctx: Context) {
    await ctx.reply("Hello from Trend Taste! 👋");
}
