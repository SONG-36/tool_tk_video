import { prisma } from "../db/client.js";

export interface CreateTrendInsightInput {
  project_id: string;
  hook_patterns: string[];
  content_structures: string[];
  pacing_patterns: string[];
  emotional_angles: string[];
  visual_patterns: string[];
  ad_formulas: string[];
  trend_source: string;
  source_text?: string | null;
  reference_links: string[];
  is_fallback: boolean;
  summary?: string | null;
}

export function createTrendInsight(data: CreateTrendInsightInput) {
  return prisma.trendInsight.create({
    data,
  });
}

export function findLatestTrendInsightByProjectId(projectId: string) {
  return prisma.trendInsight.findFirst({
    where: {
      project_id: projectId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function deleteTrendInsightsByProjectId(projectId: string) {
  return prisma.trendInsight.deleteMany({
    where: {
      project_id: projectId,
    },
  });
}
