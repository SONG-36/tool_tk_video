import { findLatestAssetGapReportByProjectId } from "../repositories/assetGapReportRepository.js";
import { listModelPromptsByProjectId } from "../repositories/modelPromptRepository.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import { findProjectById } from "../repositories/projectRepository.js";
import { listScriptsByProjectId } from "../repositories/scriptRepository.js";
import { listShotsByProjectId } from "../repositories/shotRepository.js";

interface ExportDataBuilderDependencies {
  findProjectById?: typeof findProjectById;
  findProductByProjectId?: typeof findProductByProjectId;
  listScriptsByProjectId?: typeof listScriptsByProjectId;
  listShotsByProjectId?: typeof listShotsByProjectId;
  listModelPromptsByProjectId?: typeof listModelPromptsByProjectId;
  findLatestAssetGapReportByProjectId?: typeof findLatestAssetGapReportByProjectId;
}

export interface ExportData {
  brief: {
    project: NonNullable<Awaited<ReturnType<typeof findProjectById>>>;
    product: NonNullable<Awaited<ReturnType<typeof findProductByProjectId>>>;
  };
  scripts: Awaited<ReturnType<typeof listScriptsByProjectId>>;
  shots: Awaited<ReturnType<typeof listShotsByProjectId>>;
  model_prompts: Awaited<ReturnType<typeof listModelPromptsByProjectId>>;
  asset_gap_report: NonNullable<
    Awaited<ReturnType<typeof findLatestAssetGapReportByProjectId>>
  >;
}

export async function buildExportData(
  projectId: string,
  dependencies: ExportDataBuilderDependencies = {},
): Promise<ExportData> {
  const getProject = dependencies.findProjectById ?? findProjectById;
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const listScripts =
    dependencies.listScriptsByProjectId ?? listScriptsByProjectId;
  const listShots =
    dependencies.listShotsByProjectId ?? listShotsByProjectId;
  const listPrompts =
    dependencies.listModelPromptsByProjectId ??
    listModelPromptsByProjectId;
  const getGapReport =
    dependencies.findLatestAssetGapReportByProjectId ??
    findLatestAssetGapReportByProjectId;

  const [
    project,
    product,
    scripts,
    shots,
    modelPrompts,
    assetGapReport,
  ] = await Promise.all([
    getProject(projectId),
    getProduct(projectId),
    listScripts(projectId),
    listShots(projectId),
    listPrompts(projectId),
    getGapReport(projectId),
  ]);

  if (!project) {
    throw new Error(`Project not found for export: ${projectId}`);
  }
  if (!product) {
    throw new Error(`Product not found for export: ${projectId}`);
  }
  if (!assetGapReport) {
    throw new Error(`AssetGapReport not found for export: ${projectId}`);
  }
  if (scripts.length === 0) {
    throw new Error(`No Scripts found for export: ${projectId}`);
  }
  if (shots.length === 0) {
    throw new Error(`No Shots found for export: ${projectId}`);
  }
  if (modelPrompts.length === 0) {
    throw new Error(`No ModelPrompts found for export: ${projectId}`);
  }

  const promptShotIds = new Set(
    modelPrompts.map((modelPrompt) => modelPrompt.shot_id),
  );
  const shotWithoutPrompt = shots.find((shot) => !promptShotIds.has(shot.id));
  if (shotWithoutPrompt) {
    throw new Error(
      `Shot ${shotWithoutPrompt.id} has no ModelPrompt for export`,
    );
  }

  return {
    brief: {
      project,
      product,
    },
    scripts,
    shots,
    model_prompts: modelPrompts,
    asset_gap_report: assetGapReport,
  };
}
