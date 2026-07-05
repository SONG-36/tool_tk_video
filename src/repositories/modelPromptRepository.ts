import { prisma } from "../db/client.js";
import type { VideoModel } from "../schemas/enums.js";

type JsonValue =
  | string
  | number
  | boolean
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface CreateModelPromptInput {
  project_id: string;
  script_id: string;
  shot_id: string;
  model: VideoModel;
  prompt: string;
  negative_prompt?: string | null;
  aspect_ratio?: string;
  duration: number;
  camera_motion?: string | null;
  scene_description?: string | null;
  visual_style?: string | null;
  motion_description?: string | null;
  asset_reference?: JsonValue;
  generation_notes?: string | null;
}

export function createManyModelPrompts(data: CreateModelPromptInput[]) {
  return prisma.modelPrompt.createMany({
    data,
  });
}

export function listModelPromptsByProjectId(projectId: string) {
  return prisma.modelPrompt.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: [
      {
        script_id: "asc",
      },
      {
        shot_id: "asc",
      },
      {
        created_at: "asc",
      },
    ],
  });
}

export function listModelPromptsByScriptId(scriptId: string) {
  return prisma.modelPrompt.findMany({
    where: {
      script_id: scriptId,
    },
    orderBy: [
      {
        shot_id: "asc",
      },
      {
        created_at: "asc",
      },
    ],
  });
}

export function listModelPromptsByModel(model: VideoModel) {
  return prisma.modelPrompt.findMany({
    where: {
      model,
    },
    orderBy: {
      created_at: "asc",
    },
  });
}

export function deleteModelPromptsByProjectId(
  projectId: string,
) {
  return prisma.modelPrompt.deleteMany({
    where: {
      project_id: projectId,
    },
  });
}
