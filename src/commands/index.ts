import * as run from "./task/run";
import * as set_language from "./task/set-language";
import * as set_type from "./task/set-type";
import * as set_schedule from "./task/set-schedule";
import * as enable from "./task/enable";
import * as disable from "./task/disable";
import * as check from "./task/check";
import * as help from "./help";
import * as tgHelp from "./telegram/help";
import * as tgHello from "./telegram/hello";
import * as tgBind from "./telegram/bind";
import * as tgUnbind from "./telegram/unbind";
import * as tgSetLanguage from "./telegram/set-language";
import * as tgSetType from "./telegram/set-type";
import * as tgRun from "./telegram/run";
import * as tgSetSchedule from "./telegram/set-schedule";
import * as tgEnable from "./telegram/enable";
import * as tgDisable from "./telegram/disable";
import * as tgCheck from "./telegram/check";

export const commands = {
    enable,
    disable,
    run,
    check,
    help,
    "set-language": set_language,
    "set-type": set_type,
    "set-schedule": set_schedule,
}

export const telegramCommands = [
    {
        command: tgHelp.command,
        description: tgHelp.description,
    },
    {
        command: tgHello.command,
        description: tgHello.description,
    },
    {
        command: tgBind.command,
        description: tgBind.description,
    },
    {
        command: tgUnbind.command,
        description: tgUnbind.description,
    },
    {
        command: tgSetLanguage.command,
        description: tgSetLanguage.description,
    },
    {
        command: tgSetType.command,
        description: tgSetType.description,
    },
    {
        command: tgRun.command,
        description: tgRun.description,
    },
    {
        command: tgSetSchedule.command,
        description: tgSetSchedule.description,
    },
    {
        command: tgEnable.command,
        description: tgEnable.description,
    },
    {
        command: tgDisable.command,
        description: tgDisable.description,
    },
    {
        command: tgCheck.command,
        description: tgCheck.description,
    },
];

export const telegramCommandHandlers = {
    [tgHelp.command]: tgHelp.execute,
    [tgHello.command]: tgHello.execute,
    [tgBind.command]: tgBind.execute,
    [tgUnbind.command]: tgUnbind.execute,
    [tgSetLanguage.command]: tgSetLanguage.execute,
    [tgSetType.command]: tgSetType.execute,
    [tgRun.command]: tgRun.execute,
    [tgSetSchedule.command]: tgSetSchedule.execute,
    [tgEnable.command]: tgEnable.execute,
    [tgDisable.command]: tgDisable.execute,
    [tgCheck.command]: tgCheck.execute,
};
