import { REST, Routes } from "discord.js";
import { discordConfig } from "./config";
import { commands } from "./commands/index";
import { logger } from "./utils/logger";
import type { Context } from "grammy";
import { bindTask as bindTask } from "./repositories/task.repo";
import { Platform } from "@generated/enums";
import { telegramBot } from "./bot";
import { unbindTask } from "./services/task.service";

const commandsData = Object.values(commands).map((command: any) => command.data);

const rest = new REST({ version: "10" }).setToken(discordConfig.DISCORD_TOKEN!);

type DeployCommandsProps = {
    guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
    try {
        logger.info("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationGuildCommands(discordConfig.DISCORD_APPLICATION_ID!, guildId),
            {
                body: commandsData,
            }
        );

        logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        logger.error({err: error}, "Error deploying commands");
    }
}

export async function onTelegramHelpCommand(ctx: Context) {
    ctx.reply("Available commands:\n" +
    "/help - Show this help message\n" +
    "/bind <channelId> - Bind a Telegram channel/chat ID\n");
}

export async function onTelegramHelloCommand(ctx: Context) {
    ctx.reply("Hello from Trend Taste! 👋");
}

/**
 * /bind <channelId> - Bind a Telegram chat to a Telegram channel/chat for trend updates
 * @param ctx 
 */
export async function onTelegramBindCommand(ctx: Context) {
    const text = ctx.message?.text?.trim() ?? "";
    const [, channelId] = text.split(/\s+/);

    if (!channelId) {
        await ctx.reply("Usage: /bind <channelId>\nExample: /bind -1001234567890");
        return;
    }
    try {
        const channel = await telegramBot!.api.getChat(channelId);
        await bindTask(channelId, Platform.TELEGRAM);
        await ctx.reply(`Bound bot to channel "${channel.title}" successfully.`);
    } catch (error) {
        logger.error({err: error}, "Error handling telegram bind command");
        await ctx.reply("Failed to bind this channelId. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        return;
    }
}

export async function onTelegramUnbindCommand(ctx: Context) {
    const text = ctx.message?.text?.trim() ?? "";
    const [, channelId] = text.split(/\s+/);

    if (!channelId) {
        await ctx.reply("Usage: /unbind <channelId>\nExample: /unbind -1001234567890");
        return;
    }
    try {
        const channel = await telegramBot!.api.getChat(channelId);
        await unbindTask(channelId, Platform.TELEGRAM);
        await ctx.reply(`Unbound bot from channel "${channel.title}" successfully.`);
    } catch (error) {
        logger.error({err: error}, "Error handling telegram unbind command - invalid channelId");
        await ctx.reply("Failed to unbind this channelId. Please make sure the channelId is correct.");
        return;
    }
}