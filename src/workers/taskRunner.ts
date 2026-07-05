import {
  markTaskRunFailed,
  markTaskRunProcessing,
  markTaskRunSuccess,
} from "../repositories/taskRunRepository.js";
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

  await markProcessing(taskRunId);

  try {
    const output = await handler(input);

    await markSuccess(taskRunId, output);

    return output;
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
}
