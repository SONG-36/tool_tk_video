import {
  createAsset,
  type CreateAssetInput,
} from "../repositories/assetRepository.js";
import { ASSET_TYPE, type AssetType } from "../schemas/enums.js";

export interface RegisterAssetInput {
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
}

function requireValue(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

function validateRelativeFileUrl(fileUrl: string): void {
  const hasTraversal = fileUrl.split("/").includes("..");
  const isAbsolute =
    fileUrl.startsWith("/") ||
    fileUrl.startsWith("\\") ||
    /^[a-zA-Z]:[\\/]/.test(fileUrl);

  if (isAbsolute || hasTraversal || fileUrl.includes("\\")) {
    throw new Error("file_url must be a safe relative path");
  }
}

function validateOptionalInteger(
  value: number | null | undefined,
  fieldName: string,
): void {
  if (value !== undefined && value !== null && !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
}

export function registerAsset(input: RegisterAssetInput) {
  requireValue(input.project_id, "project_id");
  requireValue(input.uploaded_by, "uploaded_by");
  requireValue(input.file_name, "file_name");
  requireValue(input.file_url, "file_url");
  requireValue(input.mime_type, "mime_type");

  if (!ASSET_TYPE.includes(input.asset_type)) {
    throw new Error("asset_type is invalid");
  }

  if (
    input.file_name.includes("/") ||
    input.file_name.includes("\\") ||
    input.file_name.includes("..")
  ) {
    throw new Error("file_name must contain only a filename");
  }

  validateRelativeFileUrl(input.file_url);

  if (!Number.isInteger(input.file_size) || input.file_size < 0) {
    throw new Error("file_size must be a non-negative integer");
  }

  validateOptionalInteger(input.duration, "duration");
  validateOptionalInteger(input.width, "width");
  validateOptionalInteger(input.height, "height");

  const data: CreateAssetInput = {
    ...input,
    status: "uploaded",
  };

  return createAsset(data);
}
