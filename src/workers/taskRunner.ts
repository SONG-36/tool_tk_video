import {
  markTaskRunFailed,
  markTaskRunProcessing,
  markTaskRunSuccess,
} from "../repositories/taskRunRepository.js";
import { advanceAfterTaskSuccess } from "../pipeline/advancePipeline.js";
import type { TaskPayload } from "../queue/queueClient.js";
import { isAppError } from "../utils/errors.js";

type TaskOutputRef = Parameters<typeof markTaskRunSuccess>[1];

export type TaskHandler<
  TInput = unknown,
  TOutput extends TaskOutputRef = TaskOutputRef,
> = (input: TInput) => TOutput | Promise<TOutput>;

interface TaskRunnerDependencies {
  markTaskRunProcessing?: typeof markTaskRunProcessing;
  markTaskRunSuccess?: typeof markTaskRunSuccess;
  markTaskRunFailed?: typeof markTaskRunFailed;
  advanceAfterTaskSuccess?: typeof advanceAfterTaskSuccess;
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (isAppError(error)) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown Worker handler error";
}

function getAdvancePayload(input: unknown): TaskPayload | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return undefined;
  }

  const payload = (input as Record<string, unknown>).payload;
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return undefined;
  }

  return payload as TaskPayload;
}

export async function runTaskWithStatus<
  TInput,
  TOutput extends TaskOutputRef,
>(
  taskRunId: string,
  handler: TaskHandler<TInput, TOutput>,
  input: TInput,
  dependencies: TaskRunnerDependencies = {},
): Promise<TOutput> {
  const markProcessing =
    dependencies.markTaskRunProcessing ?? markTaskRunProcessing;
  const markSuccess = dependencies.markTaskRunSuccess ?? markTaskRunSuccess;
  const markFailed = dependencies.markTaskRunFailed ?? markTaskRunFailed;
  const advance =
    dependencies.advanceAfterTaskSuccess ?? advanceAfterTaskSuccess;

  const taskRun = await markProcessing(taskRunId);

  let output: TOutput;
  try {
    output = await handler(input);
  } catch (error) {
    const errorMessage = getReadableErrorMessage(error);

    try {
      await markFailed(taskRunId, errorMessage);
    } catch (markFailedError) {
      throw new AggregateError(
        [error, markFailedError],
        `Worker handler failed and TaskRun ${taskRunId} could not be marked failed`,
      );
    }

    throw error;
  }

  try {
    await markSuccess(taskRunId, output);
  } catch (error) {
    const errorMessage = getReadableErrorMessage(error);

    try {
      await markFailed(taskRunId, errorMessage);
    } catch (markFailedError) {
      throw new AggregateError(
        [error, markFailedError],
        `TaskRun ${taskRunId} could not be marked success or failed`,
      );
    }

    throw error;
  }

  try {
    await advance({
      project_id: taskRun.project_id,
      completed_task_type: taskRun.task_type,
      payload: getAdvancePayload(input),
    });
  } catch (error) {
    throw new Error(
      `TaskRun ${taskRunId} succeeded but Pipeline advancement failed`,
      { cause: error },
    );
  }

  return output;
}
