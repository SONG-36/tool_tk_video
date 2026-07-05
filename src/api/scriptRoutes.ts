import type { FastifyInstance, FastifyReply } from "fastify";

import {
  findScriptById,
  listScriptsByProjectId,
} from "../repositories/scriptRepository.js";
import { createAppError, isAppError } from "../utils/errors.js";

interface ProjectParams {
  project_id: string;
}

interface ScriptParams extends ProjectParams {
  script_id: string;
}

interface ScriptRouteDependencies {
  findScriptById?: typeof findScriptById;
  listScriptsByProjectId?: typeof listScriptsByProjectId;
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

export function registerScriptRoutes(
  app: FastifyInstance,
  dependencies: ScriptRouteDependencies = {},
): void {
  const getScript = dependencies.findScriptById ?? findScriptById;
  const listScripts =
    dependencies.listScriptsByProjectId ?? listScriptsByProjectId;

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/scripts",
    async (request) => {
      const scripts = await listScripts(request.params.project_id);

      return {
        success: true,
        data: scripts,
      };
    },
  );

  app.get<{ Params: ScriptParams }>(
    "/projects/:project_id/scripts/:script_id",
    async (request, reply) => {
      const script = await getScript(request.params.script_id);

      if (!script || script.project_id !== request.params.project_id) {
        return sendRouteError(
          reply,
          createAppError({
            errorCode: "SCRIPT_NOT_FOUND",
            message: "Script not found",
            statusCode: 404,
          }),
        );
      }

      return {
        success: true,
        data: script,
      };
    },
  );
}
