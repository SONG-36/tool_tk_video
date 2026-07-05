import { prisma } from "../db/client.js";

export interface CreateScriptInput {
  project_id: string;
  trend_insight_id: string;
  title: string;
  creative_angle: string;
  target_emotion?: string | null;
  target_audience?: string | null;
  hook: string;
  main_message: string;
  voiceover: string;
  subtitles: string;
  cta: string;
  estimated_duration: number;
  required_assets: string[];
  risk_notes: string[];
  status?: string;
}

export function createManyScriptsForProject(data: CreateScriptInput[]) {
  return prisma.script.createMany({
    data,
  });
}

export function listScriptsByProjectId(projectId: string) {
  return prisma.script.findMany({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "asc",
    },
  });
}

export function findScriptById(scriptId: string) {
  return prisma.script.findUnique({
    where: {
      id: scriptId,
    },
  });
}

export function deleteScriptsByProjectId(projectId: string) {
  return prisma.script.deleteMany({
    where: {
      project_id: projectId,
    },
  });
}
