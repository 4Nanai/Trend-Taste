import { addTask } from "../scheduled/scheduler";
import { getTasksToInit } from "../services/task.service";
import { Client } from "discord.js";
import { deployCommands } from "../deploy-commands";
import { logger } from "../utils/logger";
import type { Bot } from "grammy";
import { Platform } from "@generated/enums";
import { telegramConfig } from "@/config";

/**
 * Initialize the bot:
 * - Initialize tasks
 * - Deploy commands to all guilds
 * @param client 
 */
export async function initBot(client: Client) {
    await Promise.all([
        initTasks(),
        deployCommandsToAllGuilds(client),
    ]);
}

/**
 * Initialize the Telegram bot:
 * - Initialize tasks
 * @param bot 
 */
export async function initTelegramBot(bot: Bot) {
    await Promise.all([
        initTelegramTasks(),
        registerTelegramAdmin(bot),
    ]);
}

/**
 * Initialize all enabled tasks
 */
async function initTasks() {
    const enabledTasks = await getTasksToInit();
    enabledTasks.forEach(task => {
        logger.info({taskId: task.id, schedule: task.schedule, channelId: task.channelId}, "Initializing enabled task");
        addTask(task.id, `${task.schedule!.getMinutes()} ${task.schedule!.getHours()} * * *`, task.timezone!);
    });
}

/**
 * Initialize all enabled Telegram tasks
 */
async function initTelegramTasks() {
    const enabledTasks = await getTasksToInit(Platform.TELEGRAM);
    enabledTasks.forEach(task => {
        addTask(task.id, `${task.schedule!.getMinutes()} ${task.schedule!.getHours()} * * *`, task.timezone!, Platform.TELEGRAM);
        logger.info({taskId: task.id, schedule: task.schedule, channelId: task.channelId}, "Initializing enabled Telegram task");
    });
}


/**
 * Deploy commands to all guilds
 * @param client 
 */
async function deployCommandsToAllGuilds(client: Client) {
    await Promise.all(client.guilds.cache.map(async (guild) => {
        logger.debug({guildName: guild.name, guildId: guild.id}, "Deploying commands to guild");
        await deployCommands({ guildId: guild.id });
    }));
}

/**
 * Register the Telegram admin user to be able to use bot commands
 * @param bot
 */
async function registerTelegramAdmin(bot: Bot) {
    const adminUserId = telegramConfig.TELEGRAM_ADMIN_USER_ID;
    bot.use(async (ctx, next) => {
        const text = ctx.message?.text?.trim();
        const isBotCommand = text?.startsWith(`/${telegramConfig.TELEGRAM_COMMAND_PREFIX}`);
        if (isBotCommand && ctx.from?.id.toString() === adminUserId) {
            logger.debug({ userId: ctx.from?.id }, "Admin Telegram command received");
            await next();
        } else {
            return;
        }
    });

    bot.on("message::bot_command", async (ctx) => {
        const text = ctx.message?.text?.trim() ?? "";
        const [baseCommand = "", ...args] = text.split(/\s+/);
        const normalizedBaseCommand = baseCommand.split("@")[0]?.toLowerCase();
        const subCommand = args[0]?.toLowerCase();

        logger.debug({ baseCommand: normalizedBaseCommand, subCommand, args }, "Received Telegram command");

        if (normalizedBaseCommand !== `/${telegramConfig.TELEGRAM_COMMAND_PREFIX}`) {
            return;
        }

        switch (subCommand) {
            case "help":
                await ctx.reply(`Available commands:\n/${telegramConfig.TELEGRAM_COMMAND_PREFIX} help\n/${telegramConfig.TELEGRAM_COMMAND_PREFIX} hello`);
                return;

            case "hello":
                await ctx.reply("Hello from Trend Taste! 👋");
                return;
            
            default:
                await ctx.reply(`Available commands:\n/${telegramConfig.TELEGRAM_COMMAND_PREFIX} help\n/${telegramConfig.TELEGRAM_COMMAND_PREFIX} hello`);
                return;
        }
    });
}
