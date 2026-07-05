import { prisma } from "../db/client.js";
import type { RiskLevel, ShotType } from "../schemas/enums.js";

export interface CreateShotInput {
  project_id: string;
  script_id: string;
  order_index: number;
  duration: number;
  visual: string;
  action: string;
  voiceover?: string | null;
  subtitle: string;
  shot_type: ShotType;
  asset_dependency: string[];
  missing_asset_types: string[];
  ai_fallback_possible: boolean;
  realism_risk: RiskLevel;
  recommendation?: string | null;
  camera_motion?: string | null;
  scene?: string | null;
  purpose: string;
}

export function createManyShotsForScript(data: CreateShotInput[]) {
  return prisma.shot.createMany({
    data,
  });
}

export function listShotsByScriptId(scriptId: string) {
  return prisma.shot.findMany({
    where: {
      script_id: scriptId,
    },
    orderBy: {
      order_index: "asc",
    },
  });
}

export function listShotsByProjectId(projectId: string) {
  return prisma.shot.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: [
      {
        script_id: "asc",
      },
      {
        order_index: "asc",
      },
    ],
  });
}

export function deleteShotsByProjectId(projectId: string) {
  return prisma.shot.deleteMany({
    where: {
      project_id: projectId,
    },
  });
}

export interface UpdateShotClassificationInput {
  shot_type?: ShotType;
  asset_dependency?: string[];
  missing_asset_types?: string[];
  ai_fallback_possible?: boolean;
  realism_risk?: RiskLevel;
  recommendation?: string | null;
}

export function updateShotClassification(
  shotId: string,
  data: UpdateShotClassificationInput,
) {
  return prisma.shot.update({
    where: {
      id: shotId,
    },
    data,
  });
}
