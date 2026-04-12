import type { Context } from "grammy";
import * as tgBind from "./bind";
import * as tgUnbind from "./unbind";
import * as tgSetLanguage from "./set-language";
import * as tgSetType from "./set-type";
import * as tgRun from "./run";
import * as tgSetSchedule from "./set-schedule";
import * as tgEnable from "./enable";
import * as tgDisable from "./disable";

export const command = "help";
export const description = "List available commands";

export async function execute(ctx: Context) {
    await ctx.reply(
        "Available commands:\n"
        + "/hello - Say hello to the bot\n"
        + tgBind.usage + "\n"
        + tgUnbind.usage + "\n"
        + tgSetLanguage.usage + "\n"
        + tgSetType.usage + "\n"
        + tgSetSchedule.usage + "\n"
        + tgRun.usage + "\n"
        + tgEnable.usage + "\n"
        + tgDisable.usage + "\n"
    );
}
