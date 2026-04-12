import { CronJob } from "cron";
import { runTask } from "./runner.js";
import { logger } from "../utils/logger.js";
import { Platform } from "@generated/enums.js";

// A set of taskId
// Only enabled tasks are stored here
const EnabledTasks: Map<number, CronJob> = new Map();

/**
 * Add a task
 * @param taskId 
 * @param time 
 * @param timezone
 */
export function addTask(taskId: number, time: string, timezone: string, platform: Platform = Platform.DISCORD) {
    const schedulerLogger = logger.child({taskId, scheduledTime: time, timezone});
    const job = new CronJob(
        time,
        async () => {
            try {
                schedulerLogger.info("Task running");
                const success = await runTask(taskId, platform);
                if (!success) {
                    schedulerLogger.error("Task failed");
                    removeTask(taskId);
                }
            } catch (error) {
                schedulerLogger.error({err: error}, "Error running task");
            }
        },
        null,
        true,
        timezone
    );
    EnabledTasks.set(taskId, job);
    schedulerLogger.info({nextRun: job.nextDate().toISO()},"Added task");
}

/**
 * Disable the scheduled task for the given taskId
 * @param taskId 
 */
export function removeTask(taskId: number) {
    const schedulerLogger = logger.child({taskId});
    const job = EnabledTasks.get(taskId);
    if (job) {
        job.stop();
        EnabledTasks.delete(taskId);
        schedulerLogger.info("Removed task");
    } else {
        schedulerLogger.info("Task not existing in scheduler");
    }
}

/**
 * Reschedule the task for the given taskId
 * @param taskId 
 * @param time 
 * @param timezone 
 */
export function rescheduleTask(taskId: number, time: string, timezone: string, platform: Platform = Platform.DISCORD) {
    removeTask(taskId);
    addTask(taskId, time, timezone, platform);
}
