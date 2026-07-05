import path from "node:path";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import type { FastifyInstance, FastifyReply } from "fastify";

import { findExportPackagesByProjectId } from "../repositories/exportPackageRepository.js";
import { buildProjectExportsPath } from "../storage/storagePaths.js";
import { createAppError, isAppError } from "../utils/errors.js";

interface ProjectParams {
  project_id: string;
}

interface ExportParams extends ProjectParams {
  export_package_id: string;
}

interface ExportRouteDependencies {
  findExportPackagesByProjectId?: typeof findExportPackagesByProjectId;
  verifyFile?: (filePath: string) => Promise<void>;
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

function exportNotFoundError() {
  return createAppError({
    errorCode: "EXPORT_PACKAGE_NOT_FOUND",
    message: "ExportPackage not found",
    statusCode: 404,
  });
}

function getExportZipPath(projectId: string, fileUrl: string): string {
  const expectedFileUrl = path.posix.join(
    "projects",
    projectId,
    "exports",
    "export.zip",
  );

  if (fileUrl !== expectedFileUrl) {
    throw createAppError({
      errorCode: "EXPORT_FILE_NOT_FOUND",
      message: "Export file is missing or invalid",
      statusCode: 404,
    });
  }

  return path.join(buildProjectExportsPath(projectId), "export.zip");
}

export function registerExportRoutes(
  app: FastifyInstance,
  dependencies: ExportRouteDependencies = {},
): void {
  const listExports =
    dependencies.findExportPackagesByProjectId ??
    findExportPackagesByProjectId;
  const verifyFile = dependencies.verifyFile ?? access;

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/exports",
    async (request) => {
      const exportPackages = await listExports(request.params.project_id);

      return {
        success: true,
        data: exportPackages,
      };
    },
  );

  app.get<{ Params: ExportParams }>(
    "/projects/:project_id/exports/:export_package_id",
    async (request, reply) => {
      const exportPackages = await listExports(request.params.project_id);
      const exportPackage = exportPackages.find(
        (item) => item.id === request.params.export_package_id,
      );

      if (!exportPackage) {
        return sendRouteError(reply, exportNotFoundError());
      }

      return {
        success: true,
        data: exportPackage,
      };
    },
  );

  app.get<{ Params: ExportParams }>(
    "/projects/:project_id/exports/:export_package_id/download",
    async (request, reply) => {
      const exportPackages = await listExports(request.params.project_id);
      const exportPackage = exportPackages.find(
        (item) => item.id === request.params.export_package_id,
      );

      if (!exportPackage) {
        return sendRouteError(reply, exportNotFoundError());
      }
      if (!exportPackage.file_url) {
        return sendRouteError(
          reply,
          createAppError({
            errorCode: "EXPORT_FILE_NOT_FOUND",
            message: "Export file is not available",
            statusCode: 404,
          }),
        );
      }

      let zipPath: string;
      try {
        zipPath = getExportZipPath(
          request.params.project_id,
          exportPackage.file_url,
        );
        await verifyFile(zipPath);
      } catch (error) {
        if (isAppError(error)) {
          return sendRouteError(reply, error);
        }

        return sendRouteError(
          reply,
          createAppError({
            errorCode: "EXPORT_FILE_NOT_FOUND",
            message: "export.zip is missing",
            statusCode: 404,
          }),
        );
      }

      reply.header("Content-Type", "application/zip");
      reply.header(
        "Content-Disposition",
        'attachment; filename="export.zip"',
      );

      return reply.send(createReadStream(zipPath));
    },
  );

  app.post<{ Params: ProjectParams }>(
    "/projects/:project_id/exports",
    async (request, reply) => {
      const exportPackages = await listExports(request.params.project_id);

      if (exportPackages.length > 0) {
        return {
          success: true,
          data: exportPackages[0],
        };
      }

      return sendRouteError(
        reply,
        createAppError({
          errorCode: "EXPORT_CREATION_VIA_PIPELINE_ONLY",
          message: "Export creation is available through the Pipeline only",
          statusCode: 409,
        }),
      );
    },
  );
}
