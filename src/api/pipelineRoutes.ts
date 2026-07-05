import type { FastifyInstance, FastifyReply } from "fastify";

import { env } from "../config/env.js";
import {
  enqueueTask,
  type PipelineJobData,
  type TaskPayload,
} from "../queue/queueClient.js";
import {
  findTaskRunById,
  incrementTaskRunRetry,
  listTaskRunsByProjectId,
} from "../repositories/taskRunRepository.js";
import {
  startPipeline,
  type StartPipelineInput,
} from "../services/pipelineService.js";
import { createAppError, isAppError } from "../utils/errors.js";

interface ProjectParams {
  project_id: string;
}

interface TaskRunParams {
  task_run_id: string;
}

interface StartPipelineBody {
  user_id?: string;
}

interface StartPipelineQuery {
  user_id?: string;
}

interface PipelineRouteDependencies {
  startPipeline?: (
    input: StartPipelineInput,
  ) => ReturnType<typeof startPipeline>;
  findTaskRunById?: typeof findTaskRunById;
  incrementTaskRunRetry?: typeof incrementTaskRunRetry;
  listTaskRunsByProjectId?: typeof listTaskRunsByProjectId;
  enqueueTask?: (jobData: PipelineJobData) => ReturnType<typeof enqueueTask>;
}

function sendRouteError(reply: FastifyReply, error: unknown) {
  if (!isAppError(error)) {
    throw error;
  }

  return reply.code(error.status_code).send({
    success: false,
    error,
  });
}

function retryError(
  message: string,
  errorCode: string,
  statusCode: number,
) {
  return createAppError({
    errorCode,
    message,
    statusCode,
  });
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

export function registerPipelineRoutes(
  app: FastifyInstance,
  dependencies: PipelineRouteDependencies = {},
): void {
  const startProjectPipeline = dependencies.startPipeline ?? startPipeline;
  const getTaskRun = dependencies.findTaskRunById ?? findTaskRunById;
  const incrementRetry =
    dependencies.incrementTaskRunRetry ?? incrementTaskRunRetry;
  const listTaskRuns =
    dependencies.listTaskRunsByProjectId ?? listTaskRunsByProjectId;
  const addQueueJob = dependencies.enqueueTask ?? enqueueTask;

  app.post<{
    Params: ProjectParams;
    Body: StartPipelineBody;
    Querystring: StartPipelineQuery;
  }>(
    "/projects/:project_id/pipeline/start",
    async (request, reply) => {
      try {
        const taskRun = await startProjectPipeline({
          project_id: request.params.project_id,
          user_id:
            request.body?.user_id ?? request.query.user_id?.trim() ?? "",
        });

        return reply.code(202).send({
          success: true,
          data: taskRun,
        });
      } catch (error) {
        return sendRouteError(reply, error);
      }
    },
  );

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/task-runs",
    async (request) => {
      const taskRuns = await listTaskRuns(request.params.project_id);

      return {
        success: true,
        data: taskRuns,
      };
    },
  );

  app.post<{ Params: TaskRunParams }>(
    "/task-runs/:task_run_id/retry",
    async (request, reply) => {
      const taskRun = await getTaskRun(request.params.task_run_id);

      if (!taskRun) {
        return sendRouteError(
          reply,
          retryError("TaskRun not found", "TASK_RUN_NOT_FOUND", 404),
        );
      }

      if (taskRun.status !== "failed" && taskRun.status !== "needs_user_input") {
        return sendRouteError(
          reply,
          retryError(
            "Only failed or needs_user_input TaskRuns can be retried",
            "TASK_RUN_NOT_RETRYABLE",
            409,
          ),
        );
      }

      if (taskRun.retry_count >= env.MAX_RETRY_COUNT) {
        return sendRouteError(
          reply,
          retryError(
            "TaskRun has reached the maximum retry count",
            "TASK_RUN_RETRY_LIMIT_REACHED",
            409,
          ),
        );
      }

      const retriedTaskRun = await incrementRetry(taskRun.id);
      const payload = getTaskPayload(taskRun.input_ref);

      await addQueueJob({
        task_run_id: taskRun.id,
        project_id: taskRun.project_id,
        task_type: taskRun.task_type,
        payload,
      });

      return reply.code(202).send({
        success: true,
        data: retriedTaskRun,
      });
    },
  );
}
