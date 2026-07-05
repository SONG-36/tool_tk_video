import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { createSafeFileName } from "./fileName.js";
import { buildProjectAssetsOriginalPath } from "./storagePaths.js";

export interface SaveUploadedFileInput {
  project_id: string;
  file_buffer: Buffer;
  original_file_name: string;
  mime_type: string;
}

export interface SavedFileMetadata {
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

export async function saveUploadedFile({
  project_id,
  file_buffer,
  original_file_name,
  mime_type,
}: SaveUploadedFileInput): Promise<SavedFileMetadata> {
  const storageDirectory = buildProjectAssetsOriginalPath(project_id);
  const fileName = createSafeFileName(original_file_name, mime_type);
  const storagePath = path.join(storageDirectory, fileName);

  await mkdir(storageDirectory, { recursive: true });
  await writeFile(storagePath, file_buffer, { flag: "wx" });

  return {
    file_name: fileName,
    file_url: path.posix.join(
      "projects",
      project_id,
      "assets",
      "original",
      fileName,
    ),
    file_size: file_buffer.byteLength,
    mime_type,
  };
}
