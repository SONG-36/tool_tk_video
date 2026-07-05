import { generateStructuredOutput } from "../ai/aiGeneration.js";
import { findLatestAssetGapReportByProjectId } from "../repositories/assetGapReportRepository.js";
import { listScriptsByProjectId } from "../repositories/scriptRepository.js";
import {
  createManyShotsForScript,
  deleteShotsByProjectId,
  type CreateShotInput,
} from "../repositories/shotRepository.js";
import {
  SHOT_TYPE,
  type RiskLevel,
  type ShotType,
} from "../schemas/enums.js";

export interface ShotBreakdownWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface ShotBreakdownDependencies {
  listScriptsByProjectId?: typeof listScriptsByProjectId;
  findLatestAssetGapReportByProjectId?: typeof findLatestAssetGapReportByProjectId;
  createManyShotsForScript?: typeof createManyShotsForScript;
  deleteShotsByProjectId?: typeof deleteShotsByProjectId;
  generateStructuredOutput?: typeof generateStructuredOutput;
}

function requireObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Shot output ${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Shot output ${fieldName} is required`);
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
    throw new Error(`Shot output ${fieldName} must be a string array`);
  }

  return value;
}

function requirePositiveInteger(value: unknown, fieldName: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(`Shot output ${fieldName} must be a positive integer`);
  }

  return value;
}

function requireShotType(value: unknown, fieldName: string): ShotType {
  if (
    typeof value !== "string" ||
    !SHOT_TYPE.includes(value as ShotType)
  ) {
    throw new Error(`Shot output ${fieldName} is invalid`);
  }

  return value as ShotType;
}

function getRealismRisk(
  assetAvailability: string,
  riskNotes: string[],
): RiskLevel {
  if (assetAvailability === "missing") {
    return "high";
  }
  if (assetAvailability === "unknown" || riskNotes.length > 0) {
    return "medium";
  }
  return "low";
}

export async function runShotBreakdown(
  input: ShotBreakdownWorkerInput,
  dependencies: ShotBreakdownDependencies = {},
) {
  const listScripts =
    dependencies.listScriptsByProjectId ?? listScriptsByProjectId;
  const getGapReport =
    dependencies.findLatestAssetGapReportByProjectId ??
    findLatestAssetGapReportByProjectId;
  const createShots =
    dependencies.createManyShotsForScript ?? createManyShotsForScript;
  const deleteShots =
    dependencies.deleteShotsByProjectId ?? deleteShotsByProjectId;
  const generateOutput =
    dependencies.generateStructuredOutput ?? generateStructuredOutput;

  const [scripts, gapReport] = await Promise.all([
    listScripts(input.project_id),
    getGapReport(input.project_id),
  ]);

  if (scripts.length === 0) {
    throw new Error(`No Scripts found for project ${input.project_id}`);
  }
  if (!gapReport) {
    throw new Error(`AssetGapReport not found for project ${input.project_id}`);
  }

  const shotSets: Array<{
    script_id: string;
    shots: CreateShotInput[];
  }> = [];

  for (const script of scripts) {
    const output = await generateOutput({
      template_name: "shot_breakdown.md",
      input_payload: {
        script,
        asset_gap_report: gapReport,
      },
      required_fields: ["script_id", "shots"],
    });

    if (
      !Array.isArray(output.shots) ||
      output.shots.length < 4 ||
      output.shots.length > 8
    ) {
      throw new Error(
        `Script ${script.id} must produce between 4 and 8 shots`,
      );
    }
    if (output.script_id !== script.id) {
      throw new Error(
        `Shot output script_id does not match Script ${script.id}`,
      );
    }

    const shots: CreateShotInput[] = output.shots.map(
      (shotValue, index) => {
        const shot = requireObject(
          shotValue,
          `shots[${index}] for script ${script.id}`,
        );
        if (shot.shot_index !== index + 1) {
          throw new Error(
            `Shot output shots[${index}].shot_index must be ${index + 1}`,
          );
        }
        const shotType = requireShotType(
          shot.shot_type,
          `shots[${index}].shot_type`,
        );
        const requiredAsset = optionalString(shot.required_asset);
        const assetAvailability = requireString(
          shot.asset_availability,
          `shots[${index}].asset_availability`,
        );

        if (
          !["available", "missing", "not_required", "unknown"].includes(
            assetAvailability,
          )
        ) {
          throw new Error(
            `Shot output shots[${index}].asset_availability is invalid`,
          );
        }

        const riskNotes = requireStringArray(
          shot.risk_notes,
          `shots[${index}].risk_notes`,
        );
        const hasRequiredAsset =
          requiredAsset !== null &&
          requiredAsset !== "unknown" &&
          assetAvailability !== "not_required";

        return {
          project_id: input.project_id,
          script_id: script.id,
          order_index: index + 1,
          duration: requirePositiveInteger(
            shot.duration,
            `shots[${index}].duration`,
          ),
          visual: requireString(
            shot.visual,
            `shots[${index}].visual`,
          ),
          action: requireString(
            shot.action,
            `shots[${index}].action`,
          ),
          voiceover: optionalString(shot.voiceover_segment),
          subtitle: requireString(
            shot.on_screen_text,
            `shots[${index}].on_screen_text`,
          ),
          shot_type: shotType,
          asset_dependency: hasRequiredAsset ? [requiredAsset] : [],
          missing_asset_types:
            hasRequiredAsset &&
            (assetAvailability === "missing" ||
              assetAvailability === "unknown")
              ? [requiredAsset]
              : [],
          ai_fallback_possible:
            shotType === "AI" || shotType === "HYBRID",
          realism_risk: getRealismRisk(assetAvailability, riskNotes),
          recommendation:
            riskNotes.length > 0 ? riskNotes.join(" ") : null,
          camera_motion: requireString(
            shot.camera,
            `shots[${index}].camera`,
          ),
          scene: null,
          purpose: requireString(
            shot.purpose,
            `shots[${index}].purpose`,
          ),
        };
      },
    );

    shotSets.push({
      script_id: script.id,
      shots,
    });
  }

  await deleteShots(input.project_id);

  let shotCount = 0;
  for (const shotSet of shotSets) {
    const result = await createShots(shotSet.shots);
    shotCount += result.count;
  }

  return {
    project_id: input.project_id,
    script_count: shotSets.length,
    shot_count: shotCount,
  };
}
