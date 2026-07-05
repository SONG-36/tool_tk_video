import type { FastifyInstance, FastifyReply } from "fastify";

import {
  findProjectById,
  findProjectsByUserId,
} from "../repositories/projectRepository.js";
import {
  createProject,
  type CreateProjectServiceInput,
} from "../services/projectService.js";
import { createAppError, isAppError } from "../utils/errors.js";

interface ProjectParams {
  project_id: string;
}

interface CreateProjectBody {
  user_id?: string;
  name?: string;
  target_platform?: string;
  target_market?: string;
  target_language?: string;
  objective?: string;
}

interface ListProjectsQuery {
  user_id?: string;
}

interface ProjectRouteDependencies {
  createProject?: (
    input: CreateProjectServiceInput,
  ) => ReturnType<typeof createProject>;
  findProjectById?: typeof findProjectById;
  findProjectsByUserId?: typeof findProjectsByUserId;
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

function notFoundError() {
  return createAppError({
    errorCode: "PROJECT_NOT_FOUND",
    message: "Project not found",
    statusCode: 404,
  });
}

export function registerProjectRoutes(
  app: FastifyInstance,
  dependencies: ProjectRouteDependencies = {},
): void {
  const createProjectRecord = dependencies.createProject ?? createProject;
  const getProject = dependencies.findProjectById ?? findProjectById;
  const listProjects =
    dependencies.findProjectsByUserId ?? findProjectsByUserId;

  app.post<{ Body: CreateProjectBody }>(
    "/projects",
    async (request, reply) => {
      try {
        const project = await createProjectRecord({
          user_id: request.body?.user_id ?? "",
          name: request.body?.name ?? "",
          target_platform: request.body?.target_platform,
          target_market: request.body?.target_market ?? "",
          target_language: request.body?.target_language,
          objective: request.body?.objective,
        });

        return reply.code(201).send({
          success: true,
          data: project,
        });
      } catch (error) {
        return sendRouteError(reply, error);
      }
    },
  );

  app.get<{ Querystring: ListProjectsQuery }>(
    "/projects",
    async (request, reply) => {
      const userId = request.query.user_id?.trim();

      if (!userId) {
        return sendRouteError(
          reply,
          createAppError({
            errorCode: "INVALID_PROJECT_QUERY",
            message: "user_id is required",
            statusCode: 400,
          }),
        );
      }

      const projects = await listProjects(userId);

      return {
        success: true,
        data: projects,
      };
    },
  );

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id",
    async (request, reply) => {
      const project = await getProject(request.params.project_id);

      if (!project) {
        return sendRouteError(reply, notFoundError());
      }

      return {
        success: true,
        data: project,
      };
    },
  );

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/status",
    async (request, reply) => {
      const project = await getProject(request.params.project_id);

      if (!project) {
        return sendRouteError(reply, notFoundError());
      }

      return {
        success: true,
        data: {
          project_id: project.id,
          status: project.status,
          current_step: project.current_step,
        },
      };
    },
  );
}
