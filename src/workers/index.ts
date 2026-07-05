import path from "node:path";
import { pathToFileURL } from "node:url";
import { Job, Worker } from "bullmq";

import { env } from "../config/env.js";
import type {
  PipelineJobData,
  TaskPayload,
} from "../queue/queueClient.js";
import { runTaskWithStatus } from "./taskRunner.js";
import {
  getWorkerHandler,
  type WorkerHandlerOutput,
} from "./workerRegistry.js";

const PIPELINE_QUEUE_NAME = "mvp-pipeline";

function requireJobString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Worker job ${fieldName} is required`);
  }

  return value;
}

function validateJobData(data: unknown): PipelineJobData {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Worker job data must be an object");
  }

  const candidate = data as Record<string, unknown>;
  const payload = candidate.payload ?? {};

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("Worker job payload must be an object");
  }

  return {
    task_run_id: requireJobString(candidate.task_run_id, "task_run_id"),
    project_id: requireJobString(candidate.project_id, "project_id"),
    task_type: requireJobString(
      candidate.task_type,
      "task_type",
    ) as PipelineJobData["task_type"],
    payload: payload as TaskPayload,
  };
}

async function processJob(
  job: Job<PipelineJobData>,
): Promise<WorkerHandlerOutput> {
  const data = validateJobData(job.data);
  const handler = getWorkerHandler(data.task_type);

  return runTaskWithStatus(data.task_run_id, handler, {
    project_id: data.project_id,
    payload: data.payload,
  });
}

function registerGracefulShutdown(
  worker: Worker<PipelineJobData, WorkerHandlerOutput>,
): void {
  let shutdownStarted = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;
    console.log(`Worker received ${signal}; shutting down`);

    void worker
      .close()
      .then(() => {
        console.log("Worker shutdown complete");
      })
      .catch((error: unknown) => {
        console.error("Worker shutdown failed", error);
        process.exitCode = 1;
      });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

export function startWorker(): Worker<
  PipelineJobData,
  WorkerHandlerOutput
> {
  const worker = new Worker<PipelineJobData, WorkerHandlerOutput>(
    PIPELINE_QUEUE_NAME,
    processJob,
    {
      connection: {
        url: env.QUEUE_URL,
      },
    },
  );

  worker.on("ready", () => {
    console.log(`Worker ready for queue ${PIPELINE_QUEUE_NAME}`);
  });

  worker.on("completed", (job) => {
    console.log(`Worker completed job ${job.id ?? "unknown"}`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `Worker failed job ${job?.id ?? "unknown"}: ${error.message}`,
    );
  });

  worker.on("error", (error) => {
    console.error("Worker error", error);
  });

  registerGracefulShutdown(worker);

  return worker;
}

const entryPath = process.argv[1];

if (
  entryPath &&
  pathToFileURL(path.resolve(entryPath)).href === import.meta.url
) {
  startWorker();
}
