import dotenv from "dotenv";

dotenv.config();

const {
    DISCORD_TOKEN,
    DISCORD_APPLICATION_ID,
    DISCORD_PUBLIC_KEY,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    GITHUB_API_TOKEN
} = process.env;

export var discordEnabled = false;
if (DISCORD_TOKEN && DISCORD_APPLICATION_ID && DISCORD_PUBLIC_KEY) {
    discordEnabled = true;
}

export var telegramEnabled = false;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
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
    TELEGRAM_CHAT_ID,
};

export const githubConfig = {
    GITHUB_API_TOKEN,
};
