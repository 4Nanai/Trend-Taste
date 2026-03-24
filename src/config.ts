import dotenv from "dotenv";

dotenv.config();

const {
    DISCORD_TOKEN,
    DISCORD_APPLICATION_ID,
    DISCORD_PUBLIC_KEY,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_ADMIN_USER_ID,
    TELEGRAM_COMMAND_PREFIX,
    GITHUB_API_TOKEN
} = process.env;

export var discordEnabled = false;
if (DISCORD_TOKEN && DISCORD_APPLICATION_ID && DISCORD_PUBLIC_KEY) {
    discordEnabled = true;
}

export var telegramEnabled = false;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_USER_ID && TELEGRAM_COMMAND_PREFIX) {
    telegramEnabled = true;
}

if ((!discordEnabled && !telegramEnabled) || !GITHUB_API_TOKEN) {
    throw new Error("Missing environment variables");
}

export const discordConfig = {
    DISCORD_TOKEN,
    DISCORD_APPLICATION_ID,
    DISCORD_PUBLIC_KEY,
};

export const telegramConfig = {
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_ADMIN_USER_ID,
    TELEGRAM_COMMAND_PREFIX,
};

export const githubConfig = {
    GITHUB_API_TOKEN,
};
