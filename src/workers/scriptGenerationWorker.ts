import { generateStructuredOutput } from "../ai/aiGeneration.js";
import { findLatestAssetGapReportByProjectId } from "../repositories/assetGapReportRepository.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import {
  createManyScriptsForProject,
  deleteScriptsByProjectId,
  type CreateScriptInput,
} from "../repositories/scriptRepository.js";
import { findLatestTrendInsightByProjectId } from "../repositories/trendInsightRepository.js";

export interface ScriptGenerationWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface ScriptGenerationDependencies {
  findProductByProjectId?: typeof findProductByProjectId;
  findLatestAssetGapReportByProjectId?: typeof findLatestAssetGapReportByProjectId;
  findLatestTrendInsightByProjectId?: typeof findLatestTrendInsightByProjectId;
  createManyScriptsForProject?: typeof createManyScriptsForProject;
  deleteScriptsByProjectId?: typeof deleteScriptsByProjectId;
  generateStructuredOutput?: typeof generateStructuredOutput;
}

function requireObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Script output ${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Script output ${fieldName} is required`);
  }

  return value.trim();
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`Script output ${fieldName} must be a string array`);
  }

  return value;
}

function requirePositiveInteger(value: unknown, fieldName: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(`Script output ${fieldName} must be a positive integer`);
  }

  return value;
}

function referencesMissingAsset(
  assetPlan: string[],
  missingAssets: string[],
): boolean {
  const normalizedMissingAssets = missingAssets.map((asset) =>
    asset.toLowerCase().replaceAll("_", " "),
  );

  return assetPlan.some((planItem) => {
    const normalizedPlan = planItem.toLowerCase().replaceAll("_", " ");
    return normalizedMissingAssets.some(
      (missingAsset) =>
        normalizedPlan === missingAsset ||
        normalizedPlan.includes(missingAsset),
    );
  });
}

export async function runScriptGeneration(
  input: ScriptGenerationWorkerInput,
  dependencies: ScriptGenerationDependencies = {},
) {
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const getGapReport =
    dependencies.findLatestAssetGapReportByProjectId ??
    findLatestAssetGapReportByProjectId;
  const getTrendInsight =
    dependencies.findLatestTrendInsightByProjectId ??
    findLatestTrendInsightByProjectId;
  const createScripts =
    dependencies.createManyScriptsForProject ??
    createManyScriptsForProject;
  const deleteScripts =
    dependencies.deleteScriptsByProjectId ?? deleteScriptsByProjectId;
  const generateOutput =
    dependencies.generateStructuredOutput ?? generateStructuredOutput;

  const [product, gapReport, trendInsight] = await Promise.all([
    getProduct(input.project_id),
    getGapReport(input.project_id),
    getTrendInsight(input.project_id),
  ]);

  if (!product) {
    throw new Error(`Product not found for project ${input.project_id}`);
  }
  if (!gapReport) {
    throw new Error(`AssetGapReport not found for project ${input.project_id}`);
  }
  if (!trendInsight) {
    throw new Error(`TrendInsight not found for project ${input.project_id}`);
  }

  const output = await generateOutput({
    template_name: "script_generation.md",
    input_payload: {
      product,
      asset_gap_report: gapReport,
      trend_insight: trendInsight,
    },
    required_fields: ["scripts"],
  });

  if (!Array.isArray(output.scripts) || output.scripts.length !== 5) {
    throw new Error("Script generation must return exactly 5 scripts");
  }

  const creativeAngles = new Set<string>();
  const scriptInputs: CreateScriptInput[] = output.scripts.map(
    (scriptValue, index) => {
      const script = requireObject(scriptValue, `scripts[${index}]`);
      const creativeAngle = requireString(
        script.creative_angle,
        `scripts[${index}].creative_angle`,
      );
      const normalizedAngle = creativeAngle.toLowerCase();

      if (creativeAngles.has(normalizedAngle)) {
        throw new Error("Every generated script must use a unique creative_angle");
      }
      creativeAngles.add(normalizedAngle);

      const hook = requireString(script.hook, `scripts[${index}].hook`);
      const cta = requireString(script.cta, `scripts[${index}].cta`);
      const assetUsagePlan = requireStringArray(
        script.asset_usage_plan,
        `scripts[${index}].asset_usage_plan`,
      );

      if (
        referencesMissingAsset(
          assetUsagePlan,
          gapReport.missing_assets,
        )
      ) {
        throw new Error(
          `Script ${index + 1} requires an asset marked missing by AssetGapReport`,
        );
      }

      const problem = requireString(
        script.problem,
        `scripts[${index}].problem`,
      );
      const solution = requireString(
        script.solution,
        `scripts[${index}].solution`,
      );
      const proofOrDemo = requireString(
        script.proof_or_demo,
        `scripts[${index}].proof_or_demo`,
      );

      return {
        project_id: input.project_id,
        trend_insight_id: trendInsight.id,
        title: requireString(script.title, `scripts[${index}].title`),
        creative_angle: creativeAngle,
        target_emotion: optionalString(script.target_emotion),
        target_audience: product.target_audience,
        hook,
        main_message: `Problem: ${problem}\nSolution: ${solution}\nProof or demo: ${proofOrDemo}`,
        voiceover: requireString(
          script.voiceover,
          `scripts[${index}].voiceover`,
        ),
        subtitles: requireString(
          script.on_screen_text,
          `scripts[${index}].on_screen_text`,
        ),
        cta,
        estimated_duration: requirePositiveInteger(
          script.estimated_duration,
          `scripts[${index}].estimated_duration`,
        ),
        required_assets: assetUsagePlan,
        risk_notes: requireStringArray(
          script.risk_notes,
          `scripts[${index}].risk_notes`,
        ),
      };
    },
  );

  await deleteScripts(input.project_id);
  const result = await createScripts(scriptInputs);

  return {
    project_id: input.project_id,
    script_count: result.count,
    creative_angles: scriptInputs.map((script) => script.creative_angle),
  };
}
