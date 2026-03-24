import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands/index";
import { discordConfig, telegramConfig, discordEnabled, telegramEnabled } from "./config";
import { initBot, initTelegramBot } from "./bootstrap/init-bot";
import { logger } from "./utils/logger";
import { handleButton } from "./handlers/button-handler";

import { Bot, Context, session, type SessionFlavor } from "grammy";
import type { ChatFullInfo } from "grammy/types";
console.debug("Telegram Bot enabled: " + telegramEnabled);
console.debug("Discord Bot enabled: " + discordEnabled);



export const discordClient = discordEnabled ? new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages"],
}) : null;

if (discordClient) {
    discordClient.once("clientReady", async () => {
        await initBot(discordClient);    
        logger.info("Discord bot is ready! 🤖");
    });



    discordClient.on("guildCreate", async (guild) => {
        await deployCommands({ guildId: guild.id });
    });

    discordClient.on("interactionCreate", async (interaction) => {
        logger.debug({interactionId: interaction.id}, "Interaction received");
        if (interaction.isButton()) {
            // Handle button interactions here
            logger.info({customId: interaction.customId, interactionType: interaction.type}, "Button interaction received.");
            await handleButton(interaction);
        } else if (interaction.isChatInputCommand()) {
            // Handle slash command interactions here
            const { commandName } = interaction;
            if (commands[commandName as keyof typeof commands]) {
                await commands[commandName as keyof typeof commands].execute(interaction);
            } else {
                logger.error({commandName}, "No command found");
            }
        } else {
            // Unsupported interaction type
            logger.error({interactionType: interaction.type}, "Unsupported interaction type.");
            return;
        }
    });


    discordClient.on("interactionCreate", async (interaction) => {
        logger.debug({interactionId: interaction.id}, "Interaction received");
        if (!interaction.isCommand() || !interaction.isChatInputCommand()) {
            logger.error({interactionType: interaction.type}, "Unsupported interaction type.");
            return;
        }
        const { commandName } = interaction;
        if (commands[commandName as keyof typeof commands]) {
            commands[commandName as keyof typeof commands].execute(interaction);
        } else {
            logger.error({commandName}, "No command found");
        }
    });

    discordClient.login(discordConfig.DISCORD_TOKEN);
}


export interface SessionData {
  targetChannel: ChatFullInfo | null;
}
export type MyContext = Context & SessionFlavor<SessionData>;
export const telegramBot = telegramEnabled ? new Bot<MyContext>(String(telegramConfig.TELEGRAM_BOT_TOKEN)) : null;

if (telegramBot) {
    await initTelegramBot(telegramBot);
    telegramBot.start();
    console.info("Telegram bot is ready! 🤖");
}