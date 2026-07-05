import { generateStructuredOutput } from "../ai/aiGeneration.js";
import { listAssetAnalysesByProjectId } from "../repositories/assetAnalysisRepository.js";
import {
  createAssetGapReport,
  deleteAssetGapReportsByProjectId,
} from "../repositories/assetGapReportRepository.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import { updateProjectStatus } from "../repositories/projectRepository.js";
import { RISK_LEVEL, type RiskLevel } from "../schemas/enums.js";

export interface AssetGapDetectionWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface AssetGapDetectionDependencies {
  findProductByProjectId?: typeof findProductByProjectId;
  listAssetAnalysesByProjectId?: typeof listAssetAnalysesByProjectId;
  createAssetGapReport?: typeof createAssetGapReport;
  deleteAssetGapReportsByProjectId?: typeof deleteAssetGapReportsByProjectId;
  updateProjectStatus?: typeof updateProjectStatus;
  generateStructuredOutput?: typeof generateStructuredOutput;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`Asset gap output ${fieldName} must be a string array`);
  }

  return value;
}

function requireRiskLevel(value: unknown): RiskLevel {
  if (
    typeof value !== "string" ||
    !RISK_LEVEL.includes(value as RiskLevel)
  ) {
    throw new Error("Asset gap output risk_level is invalid");
  }

  return value as RiskLevel;
}

export async function runAssetGapDetection(
  input: AssetGapDetectionWorkerInput,
  dependencies: AssetGapDetectionDependencies = {},
) {
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const listAnalyses =
    dependencies.listAssetAnalysesByProjectId ??
    listAssetAnalysesByProjectId;
  const createReport =
    dependencies.createAssetGapReport ?? createAssetGapReport;
  const deleteReports =
    dependencies.deleteAssetGapReportsByProjectId ??
    deleteAssetGapReportsByProjectId;
  const setProjectStatus =
    dependencies.updateProjectStatus ?? updateProjectStatus;
  const generateOutput =
    dependencies.generateStructuredOutput ?? generateStructuredOutput;

  const product = await getProduct(input.project_id);
  if (!product) {
    throw new Error(`Product not found for project ${input.project_id}`);
  }

  const analyses = await listAnalyses(input.project_id);

  let missingAssets: string[];
  let availableAssets: string[];
  let riskLevel: RiskLevel;
  let recommendations: string[];
  let aiSubstitutionPossible = false;

  if (analyses.length === 0) {
    missingAssets = ["basic_product_asset"];
    availableAssets = [];
    riskLevel = "blocking";
    recommendations = [
      "Provide at least one analyzable product asset before continuing.",
    ];
  } else {
    const output = await generateOutput({
      template_name: "asset_gap_detection.md",
      input_payload: {
        product,
        asset_analyses: analyses,
        target_platform: input.payload.target_platform ?? "TikTok",
        objective: input.payload.objective ?? "conversion",
      },
      required_fields: [
        "available_assets",
        "missing_assets",
        "usable_asset_summary",
        "risk_level",
        "risk_reasons",
        "recommendations",
        "needs_user_input",
      ],
      enum_constraints: {
        risk_level: RISK_LEVEL,
      },
    });

    missingAssets = requireStringArray(
      output.missing_assets,
      "missing_assets",
    );
    availableAssets = requireStringArray(
      output.available_assets,
      "available_assets",
    );
    riskLevel = requireRiskLevel(output.risk_level);
    recommendations = requireStringArray(
      output.recommendations,
      "recommendations",
    );
    aiSubstitutionPossible =
      output.ai_substitution_possible === true;

    const hasDetectedProduct = analyses.some(
      (analysis) => analysis.detected_product,
    );
    if (!hasDetectedProduct) {
      if (!missingAssets.includes("basic_product_asset")) {
        missingAssets.push("basic_product_asset");
      }
      riskLevel = "blocking";
      aiSubstitutionPossible = false;
      recommendations.push(
        "Provide a clear product image or video before continuing.",
      );
    }
  }

  await deleteReports(input.project_id);
  const report = await createReport({
    project_id: input.project_id,
    stage: "pre_script",
    missing_assets: missingAssets,
    available_assets: availableAssets,
    risk_level: riskLevel,
    ai_substitution_possible: aiSubstitutionPossible,
    recommendations,
  });

  if (riskLevel === "blocking") {
    await setProjectStatus(input.project_id, "needs_user_input");
  }

  return {
    project_id: input.project_id,
    asset_gap_report_id: report.id,
    missing_assets: missingAssets,
    available_assets: availableAssets,
    risk_level: riskLevel,
    recommendations,
  };
}
