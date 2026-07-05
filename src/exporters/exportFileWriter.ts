import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { buildProjectExportsPath } from "../storage/storagePaths.js";
import type { ExportData } from "./exportDataBuilder.js";

export const EXPORT_SOURCE_FILE_NAMES = [
  "brief.json",
  "scripts.md",
  "shots.json",
  "model_prompts.json",
  "asset_gap_report.json",
] as const;

export type ExportSourceFileName =
  (typeof EXPORT_SOURCE_FILE_NAMES)[number];

export interface ExportFileWriteResult {
  file_urls: Record<ExportSourceFileName, string>;
  included_files: ExportSourceFileName[];
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function serializeScriptsMarkdown(scripts: ExportData["scripts"]): string {
  return [
    "# Scripts",
    "",
    "```json",
    JSON.stringify(scripts, null, 2),
    "```",
    "",
  ].join("\n");
}

export async function writeExportFiles(
  projectId: string,
  exportData: ExportData,
): Promise<ExportFileWriteResult> {
  const exportDirectory = buildProjectExportsPath(projectId);
  const fileContents: Record<ExportSourceFileName, string> = {
    "brief.json": serializeJson(exportData.brief),
    "scripts.md": serializeScriptsMarkdown(exportData.scripts),
    "shots.json": serializeJson(exportData.shots),
    "model_prompts.json": serializeJson(exportData.model_prompts),
    "asset_gap_report.json": serializeJson(exportData.asset_gap_report),
  };

  await mkdir(exportDirectory, { recursive: true });

  const fileUrls = {} as Record<ExportSourceFileName, string>;
  for (const fileName of EXPORT_SOURCE_FILE_NAMES) {
    await writeFile(
      path.join(exportDirectory, fileName),
      fileContents[fileName],
      "utf8",
    );
    fileUrls[fileName] = path.posix.join(
      "projects",
      projectId,
      "exports",
      fileName,
    );
  }

  return {
    file_urls: fileUrls,
    included_files: [...EXPORT_SOURCE_FILE_NAMES],
  };
}
