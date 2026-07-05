import { env } from "../config/env.js";
import {
  enqueueTask,
  type PipelineJobData,
  type TaskPayload,
} from "../queue/queueClient.js";
import {
  findTaskRunById,
  incrementTaskRunRetry,
} from "../repositories/taskRunRepository.js";
import { createAppError } from "../utils/errors.js";

export interface RetryFailedTaskInput {
  task_run_id: string;
  project_id: string;
}

interface RetryTaskDependencies {
  findTaskRunById?: typeof findTaskRunById;
  incrementTaskRunRetry?: typeof incrementTaskRunRetry;
  enqueueTask?: (jobData: PipelineJobData) => ReturnType<typeof enqueueTask>;
}

function getTaskPayload(inputRef: unknown): TaskPayload {
  if (
    typeof inputRef === "object" &&
    inputRef !== null &&
    !Array.isArray(inputRef)
  ) {
    return inputRef as TaskPayload;
  }

  return {};
}

export async function retryFailedTask(
  input: RetryFailedTaskInput,
  dependencies: RetryTaskDependencies = {},
) {
  const getTaskRun = dependencies.findTaskRunById ?? findTaskRunById;
  const incrementRetry =
    dependencies.incrementTaskRunRetry ?? incrementTaskRunRetry;
  const addQueueJob = dependencies.enqueueTask ?? enqueueTask;

  const taskRun = await getTaskRun(input.task_run_id);

  if (!taskRun) {
    throw createAppError({
      errorCode: "TASK_RUN_NOT_FOUND",
      message: "TaskRun not found",
      statusCode: 404,
    });
  }

  if (taskRun.project_id !== input.project_id) {
    throw createAppError({
      errorCode: "TASK_RUN_PROJECT_MISMATCH",
      message: "TaskRun does not belong to this Project",
      statusCode: 403,
    });
  }

  if (taskRun.status === "success") {
    throw createAppError({
      errorCode: "TASK_RUN_NOT_RETRYABLE",
      message: "Successful TaskRuns cannot be retried",
      statusCode: 409,
    });
  }

  if (taskRun.status !== "failed") {
    throw createAppError({
      errorCode: "TASK_RUN_NOT_RETRYABLE",
      message: "Only failed TaskRuns can be retried",
      statusCode: 409,
    });
  }

  if (taskRun.retry_count >= env.MAX_RETRY_COUNT) {
    throw createAppError({
      errorCode: "TASK_RUN_RETRY_LIMIT_REACHED",
      message: "TaskRun has reached the maximum retry count",
      statusCode: 409,
    });
  }

  const retriedTaskRun = await incrementRetry(taskRun.id);
  const payload = getTaskPayload(taskRun.input_ref);

  await addQueueJob({
    task_run_id: taskRun.id,
    project_id: taskRun.project_id,
    task_type: taskRun.task_type,
    payload,
  });

  return retriedTaskRun;
}
