import path from "node:path";

import { env } from "../config/env.js";

export type ProjectStorageCategory =
  | "assets/original"
  | "analysis"
  | "prompts"
  | "exports"
  | "logs";

function assertSafeProjectId(projectId: string): void {
  if (
    projectId.trim().length === 0 ||
    projectId === "." ||
    projectId === ".." ||
    projectId.includes("/") ||
    projectId.includes("\\")
  ) {
    throw new Error("project_id must be a non-empty path segment");
  }
}

export function buildProjectStoragePath(
  projectId: string,
  category: ProjectStorageCategory,
): string {
  assertSafeProjectId(projectId);

  return path.join(env.STORAGE_ROOT, "projects", projectId, category);
}

export function buildProjectAssetsOriginalPath(projectId: string): string {
  return buildProjectStoragePath(projectId, "assets/original");
}

export function buildProjectAnalysisPath(projectId: string): string {
  return buildProjectStoragePath(projectId, "analysis");
}

export function buildProjectPromptsPath(projectId: string): string {
  return buildProjectStoragePath(projectId, "prompts");
}

export function buildProjectExportsPath(projectId: string): string {
  return buildProjectStoragePath(projectId, "exports");
}

export function buildProjectLogsPath(projectId: string): string {
  return buildProjectStoragePath(projectId, "logs");
}
