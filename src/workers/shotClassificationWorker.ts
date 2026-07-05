import { listAssetAnalysesByProjectId } from "../repositories/assetAnalysisRepository.js";
import { findLatestAssetGapReportByProjectId } from "../repositories/assetGapReportRepository.js";
import {
  listShotsByProjectId,
  updateShotClassification,
} from "../repositories/shotRepository.js";
import type { RiskLevel } from "../schemas/enums.js";

export interface ShotClassificationWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface ShotClassificationDependencies {
  listShotsByProjectId?: typeof listShotsByProjectId;
  listAssetAnalysesByProjectId?: typeof listAssetAnalysesByProjectId;
  findLatestAssetGapReportByProjectId?: typeof findLatestAssetGapReportByProjectId;
  updateShotClassification?: typeof updateShotClassification;
}

const RISK_RANK: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  blocking: 3,
};

function normalizeAssetName(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function maxRisk(current: RiskLevel, candidate: RiskLevel): RiskLevel {
  return RISK_RANK[current] >= RISK_RANK[candidate] ? current : candidate;
}

function shotRequiresHandDemo(visual: string, action: string): boolean {
  return /\b(hand|hands|hold|holding|grip|apply|applying|pour|pouring|demo|demonstrate|use|using)\b/i.test(
    `${visual} ${action}`,
  );
}

export async function runShotClassification(
  input: ShotClassificationWorkerInput,
  dependencies: ShotClassificationDependencies = {},
) {
  const listShots =
    dependencies.listShotsByProjectId ?? listShotsByProjectId;
  const listAnalyses =
    dependencies.listAssetAnalysesByProjectId ??
    listAssetAnalysesByProjectId;
  const getGapReport =
    dependencies.findLatestAssetGapReportByProjectId ??
    findLatestAssetGapReportByProjectId;
  const updateClassification =
    dependencies.updateShotClassification ?? updateShotClassification;

  const [shots, analyses, gapReport] = await Promise.all([
    listShots(input.project_id),
    listAnalyses(input.project_id),
    getGapReport(input.project_id),
  ]);

  if (shots.length === 0) {
    throw new Error(`No Shots found for project ${input.project_id}`);
  }
  if (!gapReport) {
    throw new Error(`AssetGapReport not found for project ${input.project_id}`);
  }

  const missingAssets = new Set(
    gapReport.missing_assets.map(normalizeAssetName),
  );
  const handDemoAvailable =
    !missingAssets.has("hand_demo_video") &&
    analyses.some((analysis) => analysis.detected_hands);
  const updatedShotIds: string[] = [];
  let highRiskCount = 0;
  let needsUserInputCount = 0;

  for (const shot of shots) {
    const assetDependencies = new Set(shot.asset_dependency);
    const missingAssetTypes = new Set(shot.missing_asset_types);
    const requiresHandDemo = shotRequiresHandDemo(shot.visual, shot.action);

    for (const dependency of assetDependencies) {
      if (missingAssets.has(normalizeAssetName(dependency))) {
        missingAssetTypes.add(dependency);
      }
    }

    if (requiresHandDemo) {
      assetDependencies.add("hand_demo_video");
      if (!handDemoAvailable) {
        missingAssetTypes.add("hand_demo_video");
      }
    }

    const hasMissingRealAsset = missingAssetTypes.size > 0;
    const aiFallbackPossible =
      hasMissingRealAsset &&
      (shot.shot_type === "AI" || shot.shot_type === "HYBRID");

    let realismRisk = shot.realism_risk as RiskLevel;
    if (requiresHandDemo && !handDemoAvailable) {
      realismRisk = maxRisk(realismRisk, "high");
    } else if (hasMissingRealAsset) {
      realismRisk = maxRisk(realismRisk, "high");
    }

    let recommendation = shot.recommendation;
    if (hasMissingRealAsset && aiFallbackPossible) {
      recommendation =
        "Use the AI fallback cautiously and preserve product appearance constraints.";
    } else if (hasMissingRealAsset) {
      recommendation = `needs_user_input: provide ${Array.from(
        missingAssetTypes,
      ).join(", ")}`;
      needsUserInputCount += 1;
    }

    const updated = await updateClassification(shot.id, {
      shot_type: shot.shot_type,
      asset_dependency: Array.from(assetDependencies),
      missing_asset_types: Array.from(missingAssetTypes),
      ai_fallback_possible: aiFallbackPossible,
      realism_risk: realismRisk,
      recommendation,
    });

    updatedShotIds.push(updated.id);
    if (realismRisk === "high" || realismRisk === "blocking") {
      highRiskCount += 1;
    }
  }

  return {
    project_id: input.project_id,
    classified_shot_count: updatedShotIds.length,
    high_risk_shot_count: highRiskCount,
    needs_user_input_shot_count: needsUserInputCount,
    shot_ids: updatedShotIds,
  };
}
