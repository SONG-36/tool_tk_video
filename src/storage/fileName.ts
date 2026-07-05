import path from "node:path";
import { randomUUID } from "node:crypto";

const MIME_TYPE_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

function safeExtensionFromFileName(originalFileName: string): string {
  const extension = path.extname(path.basename(originalFileName)).toLowerCase();

  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

function extensionFromMimeType(mimeType: string): string {
  const normalizedMimeType = mimeType.split(";", 1)[0]?.trim().toLowerCase();

  return normalizedMimeType ? (MIME_TYPE_EXTENSIONS[normalizedMimeType] ?? "") : "";
}

export function createSafeFileName(
  originalFileName: string,
  mimeType: string,
): string {
  const extension =
    safeExtensionFromFileName(originalFileName) || extensionFromMimeType(mimeType);

  return `${randomUUID()}${extension}`;
}
