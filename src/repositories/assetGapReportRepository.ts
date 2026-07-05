import { prisma } from "../db/client.js";
import type { AssetGapStage, RiskLevel } from "../schemas/enums.js";

export interface CreateAssetGapReportInput {
  project_id: string;
  stage: AssetGapStage;
  missing_assets: string[];
  available_assets: string[];
  risk_level: RiskLevel;
  ai_substitution_possible: boolean;
  recommendations: string[];
}

export function createAssetGapReport(data: CreateAssetGapReportInput) {
  return prisma.assetGapReport.create({
    data,
  });
}

export function findLatestAssetGapReportByProjectId(projectId: string) {
  return prisma.assetGapReport.findFirst({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function deleteAssetGapReportsByProjectId(projectId: string) {
  return prisma.assetGapReport.deleteMany({
    where: {
      project_id: projectId,
    },
  });
}
