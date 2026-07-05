import type { FastifyInstance, FastifyReply } from "fastify";

import {
  listModelPromptsByModel,
  listModelPromptsByProjectId,
  listModelPromptsByScriptId,
} from "../repositories/modelPromptRepository.js";
import {
  VIDEO_MODEL,
  type VideoModel,
} from "../schemas/enums.js";
import { createAppError, isAppError } from "../utils/errors.js";

interface ProjectParams {
  project_id: string;
}

interface ScriptParams extends ProjectParams {
  script_id: string;
}

interface ModelParams extends ProjectParams {
  model: string;
}

interface PromptRouteDependencies {
  listModelPromptsByProjectId?: typeof listModelPromptsByProjectId;
  listModelPromptsByScriptId?: typeof listModelPromptsByScriptId;
  listModelPromptsByModel?: typeof listModelPromptsByModel;
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

export function registerPromptRoutes(
  app: FastifyInstance,
  dependencies: PromptRouteDependencies = {},
): void {
  const listProjectPrompts =
    dependencies.listModelPromptsByProjectId ??
    listModelPromptsByProjectId;
  const listScriptPrompts =
    dependencies.listModelPromptsByScriptId ??
    listModelPromptsByScriptId;
  const listPromptsByModel =
    dependencies.listModelPromptsByModel ?? listModelPromptsByModel;

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/prompts",
    async (request) => {
      const prompts = await listProjectPrompts(request.params.project_id);

      return {
        success: true,
        data: prompts,
      };
    },
  );

  app.get<{ Params: ScriptParams }>(
    "/projects/:project_id/scripts/:script_id/prompts",
    async (request) => {
      const prompts = await listScriptPrompts(request.params.script_id);

      return {
        success: true,
        data: prompts.filter(
          (prompt) => prompt.project_id === request.params.project_id,
        ),
      };
    },
  );

  app.get<{ Params: ModelParams }>(
    "/projects/:project_id/prompts/model/:model",
    async (request, reply) => {
      if (!VIDEO_MODEL.includes(request.params.model as VideoModel)) {
        return sendRouteError(
          reply,
          createAppError({
            errorCode: "INVALID_VIDEO_MODEL",
            message: "model is invalid",
            statusCode: 400,
          }),
        );
      }

      const prompts = await listPromptsByModel(
        request.params.model as VideoModel,
      );

      return {
        success: true,
        data: prompts.filter(
          (prompt) => prompt.project_id === request.params.project_id,
        ),
      };
    },
  );
}
