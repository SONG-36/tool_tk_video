import path from "node:path";
import { access } from "node:fs/promises";

import { generateStructuredOutput } from "../ai/aiGeneration.js";
import { env } from "../config/env.js";
import {
  createAssetAnalysis,
  deleteAssetAnalysesByProjectId,
} from "../repositories/assetAnalysisRepository.js";
import { listAssetsByProjectId } from "../repositories/assetRepository.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import { ASSET_TYPE } from "../schemas/enums.js";

export interface AssetUnderstandingWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface AssetUnderstandingDependencies {
  findProductByProjectId?: typeof findProductByProjectId;
  listAssetsByProjectId?: typeof listAssetsByProjectId;
  createAssetAnalysis?: typeof createAssetAnalysis;
  deleteAssetAnalysesByProjectId?: typeof deleteAssetAnalysesByProjectId;
  generateStructuredOutput?: typeof generateStructuredOutput;
  verifyFile?: (fileUrl: string) => Promise<void>;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`Asset understanding output ${fieldName} must be a string array`);
  }

  return value;
}

function getOptionalScore(value: unknown, fieldName: string): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Asset understanding output ${fieldName} must be a number or null`);
  }

  return value;
}

async function verifyLocalFile(fileUrl: string): Promise<void> {
  const storageRoot = path.resolve(env.STORAGE_ROOT);

  if (
    path.isAbsolute(fileUrl) ||
    fileUrl.includes("\\") ||
    fileUrl.split("/").includes("..")
  ) {
    throw new Error("Asset file_url must be a safe relative storage path");
  }

  const filePath = path.resolve(storageRoot, fileUrl);
  if (
    filePath !== storageRoot &&
    !filePath.startsWith(`${storageRoot}${path.sep}`)
  ) {
    throw new Error("Asset file_url escapes STORAGE_ROOT");
  }

  try {
    await access(filePath);
  } catch (error) {
    throw new Error(`Asset file is missing for file_url: ${fileUrl}`, {
      cause: error,
    });
  }
}

export async function runAssetUnderstanding(
  input: AssetUnderstandingWorkerInput,
  dependencies: AssetUnderstandingDependencies = {},
) {
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const listAssets = dependencies.listAssetsByProjectId ?? listAssetsByProjectId;
  const createAnalysis =
    dependencies.createAssetAnalysis ?? createAssetAnalysis;
  const deleteAnalyses =
    dependencies.deleteAssetAnalysesByProjectId ??
    deleteAssetAnalysesByProjectId;
  const generateOutput =
    dependencies.generateStructuredOutput ?? generateStructuredOutput;
  const checkFile = dependencies.verifyFile ?? verifyLocalFile;

  const product = await getProduct(input.project_id);
  if (!product) {
    throw new Error(`Product not found for project ${input.project_id}`);
  }

  const assets = await listAssets(input.project_id);
  if (assets.length === 0) {
    throw new Error(`No Assets found for project ${input.project_id}`);
  }

  const pendingAnalyses = [];

  for (const asset of assets) {
    if (
      !asset.file_name ||
      !asset.file_url ||
      !asset.mime_type ||
      !asset.asset_type ||
      !Number.isInteger(asset.file_size) ||
      asset.file_size < 0
    ) {
      throw new Error(`Asset ${asset.id} is missing required file metadata`);
    }

    await checkFile(asset.file_url);

    const output = await generateOutput({
      template_name: "asset_understanding.md",
      input_payload: {
        product,
        asset: {
          asset_id: asset.id,
          asset_type: asset.asset_type,
          file_name: asset.file_name,
          file_url: asset.file_url,
          file_size: asset.file_size,
          mime_type: asset.mime_type,
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          aspect_ratio: asset.aspect_ratio,
          source: asset.source,
        },
        user_note: input.payload.user_note ?? null,
        visual_description: input.payload.visual_description ?? null,
      },
      required_fields: [
        "asset_id",
        "asset_type",
        "summary",
        "detected_elements",
        "possible_usage",
        "limitations",
        "quality_score",
        "risk_notes",
        "needs_user_input",
      ],
      enum_constraints: {
        asset_type: ASSET_TYPE,
      },
    });

    if (output.asset_id !== asset.id) {
      throw new Error(
        `Asset understanding output asset_id does not match Asset ${asset.id}`,
      );
    }
    if (output.asset_type !== asset.asset_type) {
      throw new Error(
        `Asset understanding output asset_type does not match Asset ${asset.id}`,
      );
    }

    const detectedObjects = requireStringArray(
      output.detected_elements,
      "detected_elements",
    );
    const normalizedElements = detectedObjects.map((element) =>
      element.toLowerCase(),
    );

    pendingAnalyses.push({
      asset_id: asset.id,
      project_id: input.project_id,
      detected_objects: detectedObjects,
      detected_people: normalizedElements.some((element) =>
        /\b(person|people|human)\b/.test(element),
      ),
      detected_hands: normalizedElements.some((element) =>
        /\bhand(s)?\b/.test(element),
      ),
      detected_product: normalizedElements.some((element) =>
        /\bproduct\b/.test(element),
      ),
      scene_type: null,
      quality_score: getOptionalScore(output.quality_score, "quality_score"),
      usability_score: null,
      possible_usage: requireStringArray(
        output.possible_usage,
        "possible_usage",
      ),
      limitations: requireStringArray(output.limitations, "limitations"),
    });
  }

  await deleteAnalyses(input.project_id);

  const createdAnalysisIds: string[] = [];
  for (const analysis of pendingAnalyses) {
    const created = await createAnalysis(analysis);
    createdAnalysisIds.push(created.id);
  }

  return {
    project_id: input.project_id,
    analyzed_asset_count: createdAnalysisIds.length,
    asset_analysis_ids: createdAnalysisIds,
  };
}
