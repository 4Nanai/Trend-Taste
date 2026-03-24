import { addTask } from "../scheduled/scheduler";
import { getTasksToInit } from "../services/task.service";
import { Client } from "discord.js";
import { deployCommands, onTelegramBindCommand, onTelegramHelloCommand, onTelegramHelpCommand, onTelegramUnbindCommand } from "../deploy-commands";
import { logger } from "../utils/logger";
import type { Bot } from "grammy";
import { Platform } from "@generated/enums";
import { telegramConfig } from "@/config";
import { describe } from "node:test";

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
        deployTelegramBotCommands(bot)
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

async function deployTelegramBotCommands(bot: Bot) {
    const commands = [
        {
            command: "help",
            description: "List available commands",
        },
        {
            command: "hello",
            description: "Say hello to the bot",
        },
        {
            command: "bind",
            description: "Bind a Telegram chat to a Telegram channel/chat for trend updates",
        },
        {
            command: "unbind",
            description: "Unbind a Telegram chat from a Telegram channel/chat",
        }
    ];
    bot.command("help", onTelegramHelpCommand);
    bot.command("hello", onTelegramHelloCommand);
    bot.command("bind", onTelegramBindCommand);
    bot.command("unbind", onTelegramUnbindCommand);
    await bot.api.setMyCommands(commands, {
        scope: {
            type: "chat",
            chat_id: telegramConfig.TELEGRAM_ADMIN_USER_ID!,
        }
    });
    console.info("Telegram bot commands deployed: " + JSON.stringify(commands));
}

/**
 * Register the Telegram admin user to be able to use bot commands
 * @param bot
 */
async function registerTelegramAdmin(bot: Bot) {
    const adminUserId = telegramConfig.TELEGRAM_ADMIN_USER_ID;
    bot.use(async (ctx, next) => {
        if (ctx.from?.id.toString() === adminUserId) {
            logger.debug({ userId: ctx.from?.id }, "Admin Telegram command received");
            await next();
        } else {
            return;
        }
    });
}
