import { Queue } from "bullmq";

import { env } from "../config/env.js";
import type { TaskType } from "../schemas/enums.js";

const PIPELINE_QUEUE_NAME = "mvp-pipeline";

export type JsonValue =
  | string
  | number
  | boolean
  | { [key: string]: JsonValue }
  | JsonValue[];

export type TaskPayload = Record<string, JsonValue>;

export interface PipelineJobData {
  task_run_id: string;
  project_id: string;
  task_type: TaskType;
  payload: TaskPayload;
}

let queueClient: Queue<PipelineJobData> | undefined;

export function getQueueClient(): Queue<PipelineJobData> {
  queueClient ??= new Queue<PipelineJobData>(PIPELINE_QUEUE_NAME, {
    connection: {
      url: env.QUEUE_URL,
    },
  });

  return queueClient;
}

export function enqueueTask(jobData: PipelineJobData) {
  return getQueueClient().add(jobData.task_type, jobData);
}
