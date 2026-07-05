import type { FastifyInstance } from "fastify";

import {
  listShotsByProjectId,
  listShotsByScriptId,
} from "../repositories/shotRepository.js";

interface ProjectParams {
  project_id: string;
}

interface ScriptParams extends ProjectParams {
  script_id: string;
}

interface ShotRouteDependencies {
  listShotsByProjectId?: typeof listShotsByProjectId;
  listShotsByScriptId?: typeof listShotsByScriptId;
}

export function registerShotRoutes(
  app: FastifyInstance,
  dependencies: ShotRouteDependencies = {},
): void {
  const listProjectShots =
    dependencies.listShotsByProjectId ?? listShotsByProjectId;
  const listScriptShots =
    dependencies.listShotsByScriptId ?? listShotsByScriptId;

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/shots",
    async (request) => {
      const shots = await listProjectShots(request.params.project_id);

      return {
        success: true,
        data: shots,
      };
    },
  );

  app.get<{ Params: ScriptParams }>(
    "/projects/:project_id/scripts/:script_id/shots",
    async (request) => {
      const shots = await listScriptShots(request.params.script_id);

      return {
        success: true,
        data: shots.filter(
          (shot) => shot.project_id === request.params.project_id,
        ),
      };
    },
  );
}
