import { prisma } from "@db";
import { Platform, type Task, type TaskType, type LanguageType } from "@generated/client";

export async function getTaskByChannelId(channelId: string, platform: Platform = Platform.DISCORD): Promise<Task | null> {
    return prisma.task.findUnique({
        where: {
            platform_channelId: {
                platform,
                channelId,
            },
        }
    });
}

export async function getTasksByEnabledStatusByPlatform(enabledStatus: boolean, platform: Platform): Promise<Task[]> {
    return prisma.task.findMany({
        where: {
            enabled: enabledStatus,
            platform: platform,
        }
    });
}

export async function getTasksToInitializeByPlatform(platform: Platform): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
        where: {
            enabled: true,
            schedule: {
                not: null,
            },
            timezone: {
                not: null,
            },
            taskType: {
                not: null,
            },
        },
    });
    return tasks;
}

export async function upsertTaskEnabledStatus(channelId: string, enabled: boolean, platform: Platform): Promise<Task> {
    return _upsertTask(channelId, { enabled }, platform);
}

export async function upsertTaskSchedule(channelId: string, schedule: Date, platform: Platform): Promise<Task> {
    return _upsertTask(channelId, { schedule }, platform);
}

export async function upsertTaskType(channelId: string, taskType: TaskType, platform: Platform): Promise<Task> {
    return _upsertTask(channelId, { taskType }, platform);
}

export async function upsertTaskLanguage(channelId: string, language: LanguageType, platform: Platform): Promise<Task> {
    return _upsertTask(channelId, { language }, platform);
}

export async function upsertTaskTimezone(channelId: string, timezone: string, platform: Platform): Promise<Task> {
    return _upsertTask(channelId, { timezone }, platform);
}

async function _upsertTask(
    channelId: string,
    data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "channelId" | "platform">>,
    platform: Platform,
): Promise<Task> {
  return prisma.task.upsert({
    where: {
      platform_channelId: {
        platform,
        channelId,
      },
    },
    update: data,
    create: { channelId, platform, ...data },
  });
}
