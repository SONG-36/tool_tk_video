import { prisma } from "../db/client.js";
import type { ExportPackageStatus } from "../schemas/enums.js";

export interface CreateExportPackageInput {
  project_id: string;
  status?: ExportPackageStatus;
  file_url?: string | null;
  included_files: string[];
  error_message?: string | null;
  completed_at?: Date | null;
}

export function createExportPackage(data: CreateExportPackageInput) {
  return prisma.exportPackage.create({
    data,
  });
}

export function findExportPackagesByProjectId(projectId: string) {
  return prisma.exportPackage.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function markExportPackageSuccess(
  exportPackageId: string,
  fileUrl: string,
  includedFiles: string[],
) {
  return prisma.exportPackage.update({
    where: {
      id: exportPackageId,
    },
    data: {
      status: "success",
      file_url: fileUrl,
      included_files: includedFiles,
      error_message: null,
      completed_at: new Date(),
    },
  });
}

export function markExportPackageFailed(
  exportPackageId: string,
  errorMessage: string,
) {
  return prisma.exportPackage.update({
    where: {
      id: exportPackageId,
    },
    data: {
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date(),
    },
  });
}
