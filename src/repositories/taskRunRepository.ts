import { prisma } from "../db/client.js";
import type { TaskStatus, TaskType } from "../schemas/enums.js";

type JsonValue =
  | string
  | number
  | boolean
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface CreateTaskRunInput {
  project_id: string;
  task_type: TaskType;
  status?: TaskStatus;
  input_ref?: JsonValue;
  output_ref?: JsonValue;
  error_message?: string | null;
  retry_count?: number;
  started_at?: Date | null;
  completed_at?: Date | null;
}

export function createTaskRun(data: CreateTaskRunInput) {
  return prisma.taskRun.create({
    data,
  });
}

export function findTaskRunById(taskRunId: string) {
  return prisma.taskRun.findUnique({
    where: {
      id: taskRunId,
    },
  });
}

export function listTaskRunsByProjectId(projectId: string) {
  return prisma.taskRun.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function markTaskRunProcessing(taskRunId: string) {
  return prisma.taskRun.update({
    where: {
      id: taskRunId,
    },
    data: {
      status: "processing",
      started_at: new Date(),
    },
  });
}

export function markTaskRunSuccess(
  taskRunId: string,
  outputRef?: JsonValue,
) {
  return prisma.taskRun.update({
    where: {
      id: taskRunId,
    },
    data: {
      status: "success",
      output_ref: outputRef,
      error_message: null,
      completed_at: new Date(),
    },
  });
}

export function markTaskRunFailed(
  taskRunId: string,
  errorMessage: string,
  status: TaskStatus = "failed",
) {
  return prisma.taskRun.update({
    where: {
      id: taskRunId,
    },
    data: {
      status,
      error_message: errorMessage,
      completed_at: new Date(),
    },
  });
}

export function incrementTaskRunRetry(taskRunId: string) {
  return prisma.taskRun.update({
    where: {
      id: taskRunId,
    },
    data: {
      retry_count: {
        increment: 1,
      },
      status: "retrying",
      started_at: new Date(),
      completed_at: null,
    },
  });
}
