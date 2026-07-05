import { generateStructuredOutput } from "../ai/aiGeneration.js";
import { findLatestAssetGapReportByProjectId } from "../repositories/assetGapReportRepository.js";
import {
  createManyModelPrompts,
  deleteModelPromptsByProjectId,
  type CreateModelPromptInput,
} from "../repositories/modelPromptRepository.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import { listShotsByProjectId } from "../repositories/shotRepository.js";
import {
  VIDEO_MODEL,
  type VideoModel,
} from "../schemas/enums.js";

export interface ModelPromptGenerationWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface ModelPromptGenerationDependencies {
  listShotsByProjectId?: typeof listShotsByProjectId;
  findProductByProjectId?: typeof findProductByProjectId;
  findLatestAssetGapReportByProjectId?: typeof findLatestAssetGapReportByProjectId;
  createManyModelPrompts?: typeof createManyModelPrompts;
  deleteModelPromptsByProjectId?: typeof deleteModelPromptsByProjectId;
  generateStructuredOutput?: typeof generateStructuredOutput;
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`ModelPrompt output ${fieldName} is required`);
  }

  return value.trim();
}

function requireStringValue(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`ModelPrompt output ${fieldName} must be a string`);
  }

  return value;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`ModelPrompt output ${fieldName} must be a string array`);
  }

  return value;
}

function getTargetModel(payload: Record<string, unknown>): VideoModel {
  const value = payload.model ?? payload.target_model ?? "kling";

  if (
    typeof value !== "string" ||
    !VIDEO_MODEL.includes(value as VideoModel)
  ) {
    throw new Error("ModelPrompt target model is invalid");
  }

  return value as VideoModel;
}

function getAspectRatio(payload: Record<string, unknown>): string {
  const value = payload.aspect_ratio ?? "9:16";

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("ModelPrompt aspect_ratio must be a non-empty string");
  }

  return value.trim();
}

export async function runModelPromptGeneration(
  input: ModelPromptGenerationWorkerInput,
  dependencies: ModelPromptGenerationDependencies = {},
) {
  const listShots =
    dependencies.listShotsByProjectId ?? listShotsByProjectId;
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const getGapReport =
    dependencies.findLatestAssetGapReportByProjectId ??
    findLatestAssetGapReportByProjectId;
  const createPrompts =
    dependencies.createManyModelPrompts ?? createManyModelPrompts;
  const deletePrompts =
    dependencies.deleteModelPromptsByProjectId ??
    deleteModelPromptsByProjectId;
  const generateOutput =
    dependencies.generateStructuredOutput ?? generateStructuredOutput;

  const [shots, product, gapReport] = await Promise.all([
    listShots(input.project_id),
    getProduct(input.project_id),
    getGapReport(input.project_id),
  ]);

  if (shots.length === 0) {
    throw new Error(`No Shots found for project ${input.project_id}`);
  }
  if (!product) {
    throw new Error(`Product not found for project ${input.project_id}`);
  }
  if (!gapReport) {
    throw new Error(`AssetGapReport not found for project ${input.project_id}`);
  }

  const targetModel = getTargetModel(input.payload);
  const aspectRatio = getAspectRatio(input.payload);
  const promptInputs: CreateModelPromptInput[] = [];

  for (const shot of shots) {
    const output = await generateOutput({
      template_name: "model_prompt_generation.md",
      input_payload: {
        shot,
        product,
        asset_gap_report: gapReport,
        target_model: targetModel,
        aspect_ratio: aspectRatio,
      },
      required_fields: [
        "shot_id",
        "model",
        "prompt",
        "negative_prompt",
        "duration",
        "aspect_ratio",
        "camera_instruction",
        "motion_instruction",
        "style_instruction",
        "product_constraints",
        "safety_constraints",
        "source_asset_requirements",
        "risk_notes",
      ],
      enum_constraints: {
        model: VIDEO_MODEL,
      },
    });

    if (output.shot_id !== shot.id) {
      throw new Error(
        `ModelPrompt output shot_id does not match Shot ${shot.id}`,
      );
    }
    if (output.model !== targetModel) {
      throw new Error(
        `ModelPrompt output model does not match target ${targetModel}`,
      );
    }
    if (output.duration !== shot.duration) {
      throw new Error(
        `ModelPrompt duration must match Shot ${shot.id} duration`,
      );
    }
    if (output.aspect_ratio !== aspectRatio) {
      throw new Error(
        `ModelPrompt aspect_ratio must match ${aspectRatio}`,
      );
    }

    const riskNotes = requireStringArray(output.risk_notes, "risk_notes");
    const productConstraints = requireStringArray(
      output.product_constraints,
      "product_constraints",
    );
    const safetyConstraints = requireStringArray(
      output.safety_constraints,
      "safety_constraints",
    );
    const sourceAssetRequirements = requireStringArray(
      output.source_asset_requirements,
      "source_asset_requirements",
    );

    promptInputs.push({
      project_id: input.project_id,
      script_id: shot.script_id,
      shot_id: shot.id,
      model: targetModel,
      prompt: requireString(output.prompt, "prompt"),
      negative_prompt: requireStringValue(
        output.negative_prompt,
        "negative_prompt",
      ),
      aspect_ratio: aspectRatio,
      duration: shot.duration,
      camera_motion: requireString(
        output.camera_instruction,
        "camera_instruction",
      ),
      scene_description: null,
      visual_style: requireString(
        output.style_instruction,
        "style_instruction",
      ),
      motion_description: requireString(
        output.motion_instruction,
        "motion_instruction",
      ),
      asset_reference: sourceAssetRequirements,
      generation_notes: [
        ...productConstraints,
        ...safetyConstraints,
        ...riskNotes,
      ].join(" ") || null,
    });
  }

  await deletePrompts(input.project_id);
  const result = await createPrompts(promptInputs);

  return {
    project_id: input.project_id,
    model: targetModel,
    aspect_ratio: aspectRatio,
    model_prompt_count: result.count,
    shot_count: shots.length,
  };
}
