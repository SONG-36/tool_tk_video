import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  listAssetsByProjectId,
} from "../repositories/assetRepository.js";
import {
  registerAsset,
  type RegisterAssetInput,
} from "../services/assetService.js";
import { ASSET_TYPE, type AssetType } from "../schemas/enums.js";
import {
  saveUploadedFile,
  type SaveUploadedFileInput,
} from "../storage/fileStorage.js";

interface ProjectParams {
  project_id: string;
}

interface MultipartField {
  value?: unknown;
}

interface MultipartFile {
  filename: string;
  mimetype: string;
  fields: Record<string, MultipartField | unknown>;
  toBuffer(): Promise<Buffer>;
}

type MultipartRequest = FastifyRequest<{
  Params: ProjectParams;
}> & {
  file?: () => Promise<MultipartFile | undefined>;
};

interface AssetRouteDependencies {
  saveUploadedFile?: (input: SaveUploadedFileInput) => ReturnType<typeof saveUploadedFile>;
  registerAsset?: (input: RegisterAssetInput) => ReturnType<typeof registerAsset>;
  listAssetsByProjectId?: typeof listAssetsByProjectId;
}

class RequestValidationError extends Error {}

function readField(fields: MultipartFile["fields"], name: string): string | undefined {
  const field = fields[name];
  const value =
    typeof field === "object" && field !== null && "value" in field
      ? (field as MultipartField).value
      : field;

  return typeof value === "string" ? value.trim() : undefined;
}

function readOptionalInteger(
  fields: MultipartFile["fields"],
  name: string,
): number | undefined {
  const value = readField(fields, name);

  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new RequestValidationError(`${name} must be an integer`);
  }

  return parsed;
}

function readRequiredField(
  fields: MultipartFile["fields"],
  name: string,
): string {
  const value = readField(fields, name);

  if (!value) {
    throw new RequestValidationError(`${name} is required`);
  }

  return value;
}

function assertSafePublicFileUrl(fileUrl: string): void {
  const isAbsolute =
    fileUrl.startsWith("/") ||
    fileUrl.startsWith("\\") ||
    /^[a-zA-Z]:[\\/]/.test(fileUrl);

  if (
    isAbsolute ||
    fileUrl.includes("\\") ||
    fileUrl.split("/").includes("..")
  ) {
    throw new Error("Asset contains an unsafe file_url");
  }
}

function validationError(reply: FastifyReply, message: string) {
  return reply.code(400).send({
    success: false,
    error: {
      error_code: "INVALID_ASSET_UPLOAD",
      message,
      status_code: 400,
    },
  });
}

export function registerAssetRoutes(
  app: FastifyInstance,
  dependencies: AssetRouteDependencies = {},
): void {
  const storeFile = dependencies.saveUploadedFile ?? saveUploadedFile;
  const createAssetRecord = dependencies.registerAsset ?? registerAsset;
  const listProjectAssets =
    dependencies.listAssetsByProjectId ?? listAssetsByProjectId;

  app.post<{ Params: ProjectParams }>(
    "/projects/:project_id/assets",
    async (request, reply) => {
      const multipartRequest = request as MultipartRequest;

      if (typeof multipartRequest.file !== "function") {
        // TODO: Register a Fastify multipart plugin in app.ts before enabling uploads.
        return reply.code(501).send({
          success: false,
          error: {
            error_code: "MULTIPART_NOT_CONFIGURED",
            message: "Multipart upload support is not configured",
            status_code: 501,
          },
        });
      }

      try {
        const uploadedFile = await multipartRequest.file();
        if (!uploadedFile) {
          return validationError(reply, "file is required");
        }

        const fileBuffer = await uploadedFile.toBuffer();
        const uploadedBy = readRequiredField(uploadedFile.fields, "uploaded_by");
        const assetTypeValue = readRequiredField(
          uploadedFile.fields,
          "asset_type",
        );

        if (!ASSET_TYPE.includes(assetTypeValue as AssetType)) {
          throw new RequestValidationError("asset_type is invalid");
        }

        const savedFile = await storeFile({
          project_id: request.params.project_id,
          file_buffer: fileBuffer,
          original_file_name: uploadedFile.filename,
          mime_type: uploadedFile.mimetype,
        });

        const asset = await createAssetRecord({
          project_id: request.params.project_id,
          uploaded_by: uploadedBy,
          asset_type: assetTypeValue as AssetType,
          ...savedFile,
          duration: readOptionalInteger(uploadedFile.fields, "duration"),
          width: readOptionalInteger(uploadedFile.fields, "width"),
          height: readOptionalInteger(uploadedFile.fields, "height"),
          aspect_ratio: readField(uploadedFile.fields, "aspect_ratio"),
          source: readField(uploadedFile.fields, "source"),
        });

        assertSafePublicFileUrl(asset.file_url);

        return reply.code(201).send({
          success: true,
          data: asset,
        });
      } catch (error) {
        if (error instanceof RequestValidationError) {
          return validationError(reply, error.message);
        }

        throw error;
      }
    },
  );

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/assets",
    async (request) => {
      const assets = await listProjectAssets(request.params.project_id);

      for (const asset of assets) {
        assertSafePublicFileUrl(asset.file_url);
      }

      return {
        success: true,
        data: assets,
      };
    },
  );
}
