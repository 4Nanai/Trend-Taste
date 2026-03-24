import { REST, Routes } from "discord.js";
import { discordConfig, telegramConfig } from "./config";
import { commands, telegramCommands, telegramCommandHandlers } from "./commands/index";
import { logger } from "./utils/logger";
import type { Bot } from "grammy";
import { languageMenu } from "./commands/telegram/set-language";
import type { MyContext } from "./bot";

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

export async function deployTelegramBotCommands(bot: Bot<MyContext>) {
    bot.use(languageMenu);

    for (const [command, handler] of Object.entries(telegramCommandHandlers)) {
        bot.command(command, handler);
    }

    await bot.api.setMyCommands(telegramCommands, {
        scope: {
            type: "chat",
            chat_id: telegramConfig.TELEGRAM_ADMIN_USER_ID!,
        },
    });

    logger.debug("Telegram bot commands deployed: " + JSON.stringify(telegramCommands));
}