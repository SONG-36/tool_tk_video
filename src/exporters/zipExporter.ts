import path from "node:path";
import { execFile } from "node:child_process";
import { access, rm, stat } from "node:fs/promises";
import { promisify } from "node:util";

import { buildProjectExportsPath } from "../storage/storagePaths.js";
import {
  EXPORT_SOURCE_FILE_NAMES,
  type ExportFileWriteResult,
} from "./exportFileWriter.js";

const execFileAsync = promisify(execFile);

export interface ExportZipResult {
  file_url: string;
  included_files: string[];
}

export async function createExportZip(
  projectId: string,
  exportFiles: ExportFileWriteResult,
): Promise<ExportZipResult> {
  const exportDirectory = buildProjectExportsPath(projectId);
  const sourcePaths: string[] = [];

  for (const fileName of EXPORT_SOURCE_FILE_NAMES) {
    const expectedFileUrl = path.posix.join(
      "projects",
      projectId,
      "exports",
      fileName,
    );

    if (exportFiles.file_urls[fileName] !== expectedFileUrl) {
      throw new Error(`Export file URL is missing or invalid: ${fileName}`);
    }

    const sourcePath = path.join(exportDirectory, fileName);
    try {
      await access(sourcePath);
    } catch (error) {
      throw new Error(`Required export file is missing: ${fileName}`, {
        cause: error,
      });
    }
    sourcePaths.push(sourcePath);
  }

  const zipPath = path.join(exportDirectory, "export.zip");
  await rm(zipPath, { force: true });

  try {
    await execFileAsync("zip", ["-q", "-j", zipPath, ...sourcePaths]);
  } catch (error) {
    throw new Error("Failed to create export.zip", { cause: error });
  }

  const zipStats = await stat(zipPath);
  if (!zipStats.isFile() || zipStats.size === 0) {
    throw new Error("Created export.zip is empty or invalid");
  }

  return {
    file_url: path.posix.join(
      "projects",
      projectId,
      "exports",
      "export.zip",
    ),
    included_files: [...EXPORT_SOURCE_FILE_NAMES, "export.zip"],
  };
}
