import { type SessionContext } from "@/bot";
import { COMMON_TIMEZONES } from "@/constants/timezones";
import { setTaskSchedule, setTaskTimezone } from "@/services/task.service";
import { logger } from "@/utils/logger";
import { verifyChannelIdInput } from "@/utils/telegram";
import { Platform } from "@generated/enums";
import { Menu } from "@grammyjs/menu";
import type { ChatFullInfo } from "grammy/types";
import { DateTime } from "luxon";

export const command = "schedule";
export const description = "Set the schedule for this channel's task"
export const usage = "/schedule <ChannelID>\nExample: /schedule -1001234567890"

export const scheduleMenu = new Menu<SessionContext>("schedule-menu")
    .submenu((ctx) => {
        const currentTimezone = ctx.session.scheduleConfig?.timezone;
        const displayText = currentTimezone ? `Timezone: ${currentTimezone.split("/")[1]?.replace("_", " ")}` : "Set Timezone";
        return displayText;
    }, "timezone-menu")
    .row()
    .submenu((ctx) => {
        const currentHour = ctx.session.scheduleConfig?.hour;
        const displayText = currentHour ? `Hour: ${currentHour}` : "Set Hour";
        return displayText;
    }, "hour-menu")
    .submenu((ctx) => {
        const currentMinute = ctx.session.scheduleConfig?.minute;
        const displayText = currentMinute ? `Minute: ${currentMinute}` : "Set Minute";
        return displayText;
    }, "minute-menu")
    .dynamic((ctx, range) => {
        const { timezone, hour, minute } = ctx.session.scheduleConfig || {};
        if (timezone && hour && minute) {
            range.row().text("Done", async (c) => {
                c.menu.close();
                await _handleScheduleConfigDone(ctx);
            })
        } 
        return range;
    })

export async function execute(ctx: SessionContext) { 
    const { channelId, channel, error } = await verifyChannelIdInput(ctx, usage)
    if (error) {
        logger.error({err: error}, "Failed to verify channel ID input for schedule command");
        return;
    }
    
    // Store the target channel in session for configuration
    ctx.session.targetChannel = channel;
    ctx.session.cmdLogger = logger.child({command: command, channelId: channelId})
    await _sendScheduleSelection(ctx, channel!);
}

async function _sendScheduleSelection(ctx: SessionContext, channel: ChatFullInfo) {
    await ctx.reply(
        `Please choose what to set for channel <i>"${channel?.title}"</i>:`,
        {
            reply_markup: scheduleMenu,
            parse_mode: "HTML",
        },
    );
}

export const timezoneMenu = new Menu<SessionContext>("timezone-menu")
COMMON_TIMEZONES.forEach((tz, index) => {
    const displayName = tz.split("/")[1]?.replace("_", " ") || tz;
    timezoneMenu.text(displayName, async (ctx) => {
        try {
            if (!ctx.session.scheduleConfig) {
                ctx.session.scheduleConfig = {
                    timezone: tz,
                }
            } else {
                ctx.session.scheduleConfig.timezone = tz;
            }
            ctx.menu.back();
            await _updateScheduleMenuText(ctx);
        } catch (error) {
            ctx.session.cmdLogger?.error({err: error, timezone: tz}, "Error setting task timezone");
            await ctx.editMessageText(`Failed to set timezone to ${tz}. Please try again later.`);
            ctx.menu.close();
            return;
        }
    })
    if ((index + 1) % 2 === 0) { 
        timezoneMenu.row();
    }
})
timezoneMenu.row().back("Go Back");
scheduleMenu.register(timezoneMenu);

export const hourMenu = new Menu<SessionContext>("hour-menu")
for (let hour = 0; hour < 24; hour++) {
    const displayHour = hour.toString().padStart(2, '0');
    hourMenu.text(displayHour, async (ctx) => {
        try {
            if (!ctx.session.scheduleConfig) {
                ctx.session.scheduleConfig = {
                    hour: displayHour,
                }
            } else {
                ctx.session.scheduleConfig.hour = displayHour;
            }
            ctx.menu.back();
            await _updateScheduleMenuText(ctx);
        } catch (error) {
            ctx.session.cmdLogger?.error({err: error, hour: displayHour}, "Error setting task hour");
            await ctx.editMessageText(`Failed to set hour to ${displayHour}. Please try again later.`);
            ctx.menu.close();
            return;
        }
    })

    if ((hour + 1) % 6 === 0) {
        hourMenu.row();
    }
}
hourMenu.row().back("Go Back");
scheduleMenu.register(hourMenu);

const minuteMenu = new Menu<SessionContext>("minute-menu")
for (let minute = 0; minute < 60; minute += 5) {
    const displayMinute = minute.toString().padStart(2, '0');
    minuteMenu.text(displayMinute, async (ctx) => {
        try {
            if (!ctx.session.scheduleConfig) {
                ctx.session.scheduleConfig = {
                    minute: displayMinute,
                }
            } else {
                ctx.session.scheduleConfig.minute = displayMinute;
            }
            ctx.menu.back();
            await _updateScheduleMenuText(ctx);
        } catch (error) {
            ctx.session.cmdLogger?.error({err: error, minute: displayMinute}, "Error setting task minute");
            await ctx.editMessageText(`Failed to set minute to ${displayMinute}. Please try again later.`);
            ctx.menu.close();
            return;
        }
    })

    if ((minute + 5) % 20 === 0) {
        minuteMenu.row();
    }
}
minuteMenu.row().back("Go Back");
scheduleMenu.register(minuteMenu);

async function _updateScheduleMenuText(ctx: SessionContext) {
    const { timezone, hour, minute } = ctx.session.scheduleConfig || {};
    const timezoneText = timezone?.split("/")[1]?.replace("_", " ");
    const updatedText = `Current config: ${timezoneText ? `Timezone: ${timezoneText}` : "Timezone not set"}, `
        + `${hour ? `Hour: ${hour}` : "Hour not set"}, `
        + `${minute ? `Minute: ${minute}` : "Minute not set"}`;
    await ctx.editMessageText(updatedText, {
        parse_mode: "HTML",
    });
}
async function _handleScheduleConfigDone(ctx: SessionContext) {
    const { timezone, hour, minute } = ctx.session.scheduleConfig || {};
    if (!hour || !minute || !timezone) {
        return;
    }
    const timeAsDate = new Date(`1970-01-01T${hour}:${minute}:00Z`);
    try {
        await setTaskTimezone(String(ctx.session.targetChannel!.id), timezone, Platform.TELEGRAM);
        const task = await setTaskSchedule(String(ctx.session.targetChannel!.id), timeAsDate, Platform.TELEGRAM);
        const scheduledTime = task.schedule!;
        let scheduledLuxonTime = DateTime.now()
            .setZone(task.timezone!)
            .set({
                hour: scheduledTime.getUTCHours(), 
                minute: scheduledTime.getUTCMinutes(), 
                second: 0, 
                millisecond: 0 
            });
        if (scheduledLuxonTime < DateTime.now().setZone(task.timezone!)) {
            scheduledLuxonTime = scheduledLuxonTime.plus({ days: 1 });
        }

        const response = `✅\n`
        + `Your task is scheduled to `
        + `${scheduledTime.getUTCHours().toString().padStart(2, '0')}:${scheduledTime.getUTCMinutes().toString().padStart(2, '0')} `
        + `everyday for ${task.timezone} (UTC${scheduledLuxonTime.toFormat("ZZ")})\n`
        + `Next run: ${scheduledLuxonTime.toLocaleString(DateTime.DATETIME_FULL)}`;
        await ctx.editMessageText(response);
    } catch (error) {
        ctx.session.cmdLogger?.error({err: error, hour, minute, timezone}, "Error setting task schedule");
        await ctx.editMessageText(`Failed to set schedule. Please try again later.`);
        // Clear the session config
        ctx.session.scheduleConfig = {};
        ctx.session.cmdLogger = null;
        return;
    }
}
