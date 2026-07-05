import { prisma } from "../db/client.js";
import type { AssetStatus, AssetType } from "../schemas/enums.js";

export interface CreateAssetInput {
  project_id: string;
  uploaded_by: string;
  asset_type: AssetType;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: string | null;
  source?: string | null;
  status?: AssetStatus;
}

export function createAsset(data: CreateAssetInput) {
  return prisma.asset.create({
    data,
  });
}

export function listAssetsByProjectId(projectId: string) {
  return prisma.asset.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function findAssetById(assetId: string) {
  return prisma.asset.findUnique({
    where: {
      id: assetId,
    },
  });
}

export function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
) {
  return prisma.asset.update({
    where: {
      id: assetId,
    },
    data: {
      status,
    },
  });
}
