import { addTask } from "../scheduled/scheduler";
import { getTasksToInit } from "../services/task.service";
import { Client } from "discord.js";
import { deployCommands, deployTelegramBotCommands } from "../deploy-commands";
import { logger } from "../utils/logger";
import { session, type Bot, type Context, type SessionFlavor } from "grammy";
import { Platform } from "@generated/enums";
import { telegramConfig } from "@/config";
import type { SessionContext, SessionData } from "@/bot";


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
export async function initTelegramBot(bot: Bot<SessionContext>) {
    initTelegramBotSession(bot);
    await Promise.all([
        initTelegramTasks(),
        registerTelegramAdmin(bot),
        deployTelegramBotCommands(bot),
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
async function registerTelegramAdmin(bot: Bot<SessionContext>) {
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


function initTelegramBotSession(bot: Bot<SessionContext>) {
    function initial(): SessionData {
        return {
            targetChannel: null,
        }
    }
    bot.use(session({ initial}));
}
