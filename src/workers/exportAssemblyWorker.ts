import {
  buildExportData,
  type ExportData,
} from "../exporters/exportDataBuilder.js";
import {
  writeExportFiles,
  type ExportFileWriteResult,
} from "../exporters/exportFileWriter.js";
import {
  createExportZip,
  type ExportZipResult,
} from "../exporters/zipExporter.js";
import { createExportPackage } from "../repositories/exportPackageRepository.js";
import { updateProjectStatus } from "../repositories/projectRepository.js";

export interface ExportAssemblyWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface ExportAssemblyDependencies {
  buildExportData?: (projectId: string) => Promise<ExportData>;
  writeExportFiles?: (
    projectId: string,
    exportData: ExportData,
  ) => Promise<ExportFileWriteResult>;
  createExportZip?: (
    projectId: string,
    exportFiles: ExportFileWriteResult,
  ) => Promise<ExportZipResult>;
  createExportPackage?: typeof createExportPackage;
  updateProjectStatus?: typeof updateProjectStatus;
}

export async function runExportAssembly(
  input: ExportAssemblyWorkerInput,
  dependencies: ExportAssemblyDependencies = {},
) {
  const getExportData = dependencies.buildExportData ?? buildExportData;
  const writeFiles = dependencies.writeExportFiles ?? writeExportFiles;
  const createZip = dependencies.createExportZip ?? createExportZip;
  const createPackage =
    dependencies.createExportPackage ?? createExportPackage;
  const setProjectStatus =
    dependencies.updateProjectStatus ?? updateProjectStatus;

  const exportData = await getExportData(input.project_id);
  const exportFiles = await writeFiles(input.project_id, exportData);
  const zipResult = await createZip(input.project_id, exportFiles);

  const exportPackage = await createPackage({
    project_id: input.project_id,
    status: "success",
    file_url: zipResult.file_url,
    included_files: zipResult.included_files,
    error_message: null,
    completed_at: new Date(),
  });

  await setProjectStatus(input.project_id, "completed");

  return {
    project_id: input.project_id,
    export_package_id: exportPackage.id,
    file_url: zipResult.file_url,
    included_files: zipResult.included_files,
    project_status: "completed",
  };
}
