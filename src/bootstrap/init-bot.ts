import { addTask } from "../scheduled/scheduler";
import { getTasksToInit } from "../services/task.service";
import { Client } from "discord.js";
import { deployCommands } from "../deploy-commands";
import { logger } from "../utils/logger";
import type { Bot } from "grammy";

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
    const enabledTasks = await getTasksToInit();
    enabledTasks.forEach(task => {
        logger.info("");
    })
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
 * Deploy commands to all guilds
 * @param client 
 */
async function deployCommandsToAllGuilds(client: Client) {
    await Promise.all(client.guilds.cache.map(async (guild) => {
        logger.debug({guildName: guild.name, guildId: guild.id}, "Deploying commands to guild");
        await deployCommands({ guildId: guild.id });
    }));
}
