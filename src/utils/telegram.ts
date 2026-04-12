import type { SessionContext } from "@/bot";
import { getTaskByChannelId } from "@/services/task.service";
import type { Task } from "@generated/client";
import { Platform } from "@generated/enums";
import type { ChatFullInfo } from "grammy/types";

type ChannelVerificationResult = {
    channelId: string | null,
    channel: ChatFullInfo | null,
    task: Task | null,
    error: string | null }

export function convertMdToHtml(text: string): string {
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    htmlText = htmlText.replace(/^- /gm, '• ');
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<i>$1</i>');
    htmlText = htmlText.replace(/`(.*?)`/g, '<code>$1</code>');
    return htmlText;
}

export function escapeHTML(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function telegramFooter(): string {
    return `<i>Powered by:</i> <a href="https://github.com/yyxff/Trend-Taste">Trend Taste</a>`
}

export async function verifyChannelIdInput(ctx: SessionContext, usage: string | null = null): Promise<ChannelVerificationResult> {
    const text = ctx.message?.text?.trim() ?? "";
    const parts = text.split(/\s+/);
    let channelId = parts[1];
    let channel: ChatFullInfo | null = null;
    let task: Task | null = null;

    if (channelId && ctx.session.targetChannel && String(ctx.session.targetChannel.id) !== channelId) {
        await ctx.reply("A channel is already selected for language setting. Please complete the current language setting process before starting a new one.");
        return {
            channelId: null,
            channel: null,
            task: null,
            error: "Configuration in progress for another channel."
        }
    }

    if (!channelId && ctx.session.targetChannel) {
        channel = ctx.session.targetChannel;
        channelId = String(channel.id);
    }

    if (!channelId) {
        if (usage) {
            await ctx.reply(`Usage: ${usage}`);
        } else {
            await ctx.reply("Usage: /command <ChannelID>\nExample: /command -1001234567890");
        }
        return {
            channelId: null,
            channel: null,
            task: null,
            error: "ChannelID not provided."
        }
    }

    // Check if the channel is already bound to a task
    try {
        task = await getTaskByChannelId(channelId, Platform.TELEGRAM);
        if (!task) {
            await ctx.reply("Unbound channel. Please bind this channel first using /bind command before setting a task type.");
            return {
                channelId: null,
                channel: null,
                task: null,
                error: "Channel not bound to any task."
            }
        }
    } catch (error) {
        await ctx.reply("Error retrieving task information for this channel. Please try again later.");
        return {
            channelId: null,
            channel: null,
            task: null,
            error: `Error retrieving task information for channelId ${channelId}.`
        }
    }

    try {
        if (!channel) {
            channel = await ctx.api.getChat(channelId);
        }
    } catch (error) {
        await ctx.reply("Failed to find this channelId. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        return {
            channelId: null,
            channel: null,
            task: null,
            error: "Failed to find the channel with the provided channelId."
        }
    }

    if (!channel) {
        await ctx.reply("Channel not found. Please make sure the channelId is correct and that I am a member of that channel/chat.");
        return {
            channelId: null,
            channel: null,
            task: null,
            error: "Channel not found with the provided channelId."
        }
    }

    // Store the verified channel in session
    ctx.session.targetChannel = channel;
    return {
        channelId,
        channel,
        task,
        error: null
    }
}
