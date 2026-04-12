import { Platform, type Task, type TaskType, type LanguageType } from "@generated/client";
import { prisma } from "@db";
import { DateTime } from "luxon";
import { bindTask, upsertTaskEnabledStatus, upsertTaskLanguage, upsertTaskSchedule, upsertTaskType, upsertTaskTimezone, getTasksByEnabledStatusByPlatform, getTasksToInitializeByPlatform, deleteTask } from "../repositories/task.repo";
import { removeTask, rescheduleTask } from "../scheduled/scheduler";
import { logger } from "../utils/logger";

/**
 * Get a task by its ID
 * @param taskId The ID of the task to retrieve
 * @returns The task if found, otherwise null
 */
export async function getTaskById(taskId: number): Promise<Task | null> {
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a task for a channel and platform
 * @param channelId The channel/chat ID of the task to create
 * @param platform The target platform
 * @returns The created task
 */
export async function createTask(channelId: string, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await bindTask(channelId, platform);
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Delete a task by its channel ID and platform
 * @param channelId The channel/chat ID of the task to delete
 * @param platform The target platform
 * @returns The deleted task
 */
export async function unbindTask(channelId: string, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await deleteTask(channelId, platform);
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Get a task by its channel ID
 * @param channelId The channel ID of the task to retrieve
 * @returns The task if found, otherwise null
 */
export async function getTaskByChannelId(channelId: string, platform: Platform = Platform.DISCORD): Promise<Task | null> {
    try {
        const task = await prisma.task.findUnique({
            where: {
                platform_channelId: {
                    platform,
                    channelId,
                },
            },
        });
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Get all enabled tasks
 * @returns 
 */
export async function getAllEnabledTasks(platform: Platform = Platform.DISCORD): Promise<Task[]> {
    try {
        const tasks = await getTasksByEnabledStatusByPlatform(true, platform);
        return tasks;
    } catch (error) {
        throw error;
    }
}

/**
 * Get tasks with valid set eat/to initialize
 * @returns 
 */
export async function getTasksToInit(platform: Platform = Platform.DISCORD): Promise<Task[]> {
    try {
        const tasks = await getTasksToInitializeByPlatform(platform);
        return tasks;
    } catch (error) {
        throw error;
    }
}

/**
 * set the schedule for a task
 * @param channelId 
 * @param schedule 
 * @returns The updated or created Task
 */
export async function setTaskSchedule(channelId: string, schedule: Date, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await upsertTaskSchedule(channelId, schedule, platform);
        if (task.enabled && task.timezone) {
            if (platform === Platform.DISCORD) {
                rescheduleTask(task.id, `${schedule.getMinutes()} ${schedule.getHours()} * * *`, task.timezone, platform);
            }
            if (platform === Platform.TELEGRAM) {
                rescheduleTask(task.id, `${schedule.getUTCMinutes()} ${schedule.getUTCHours()} * * *`, task.timezone, platform);
            }
        }
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Set the task type for a task
 * @param channelId 
 * @param taskType 
 * @returns The updated or created Task
 */
export async function setTaskType(channelId: string, taskType: TaskType, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await upsertTaskType(channelId, taskType, platform);
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Set the enabled status for a task
 * @param channelId 
 * @param enabled 
 * @returns The updated or created Task
 */
export async function enableTask(channelId: string, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await upsertTaskEnabledStatus(channelId, true, platform);
        logger.info({taskId: task.id}, "enabled task");
        if (task.schedule && task.timezone) {
            const localTime = DateTime.fromJSDate(task.schedule, { zone: "utc" });
            const cronExprLocal = `${localTime.minute} ${localTime.hour} * * *`;
            rescheduleTask(task.id, cronExprLocal, task.timezone);
        }
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Disable a task
 * @param channelId 
 * @returns The updated or created Task
 */
export async function disableTask(channelId: string, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await upsertTaskEnabledStatus(channelId, false, platform);
        logger.info({taskId: task.id}, "disabled task");
        if (task.schedule && task.timezone) {
            removeTask(task.id);
        }
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Set the preferred language for a task
 * @param channelId 
 * @param language 
 * @returns The updated or created Task
 */
export async function setTaskLanguage(channelId: string, language: LanguageType, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await upsertTaskLanguage(channelId, language, platform);
        return task;
    } catch (error) {
        throw error;
    }
}

/**
 * Set the timezone for a task
 * @param channelId 
 * @param timezone 
 * @returns The updated or created Task
 */
export async function setTaskTimezone(channelId: string, timezone: string, platform: Platform = Platform.DISCORD): Promise<Task> {
    try {
        const task = await upsertTaskTimezone(channelId, timezone, platform);
        return task;
    } catch (error) {
        throw error;
    }
}
