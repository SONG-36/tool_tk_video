import { prisma } from "../db/client.js";

export interface CreateAssetAnalysisInput {
  asset_id: string;
  project_id: string;
  detected_objects: string[];
  detected_people: boolean;
  detected_hands: boolean;
  detected_product: boolean;
  scene_type?: string | null;
  quality_score?: number | null;
  usability_score?: number | null;
  possible_usage: string[];
  limitations: string[];
}

export function createAssetAnalysis(data: CreateAssetAnalysisInput) {
  return prisma.assetAnalysis.create({
    data,
  });
}

export function listAssetAnalysesByProjectId(projectId: string) {
  return prisma.assetAnalysis.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function findAssetAnalysisByAssetId(assetId: string) {
  return prisma.assetAnalysis.findUnique({
    where: {
      asset_id: assetId,
    },
  });
}

export function deleteAssetAnalysesByProjectId(projectId: string) {
  return prisma.assetAnalysis.deleteMany({
    where: {
      project_id: projectId,
    },
  });
}
