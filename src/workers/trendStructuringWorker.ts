import { generateStructuredOutput } from "../ai/aiGeneration.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import {
  createTrendInsight,
  deleteTrendInsightsByProjectId,
} from "../repositories/trendInsightRepository.js";

export interface TrendStructuringWorkerInput {
  task_run_id?: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface TrendStructuringDependencies {
  findProductByProjectId?: typeof findProductByProjectId;
  createTrendInsight?: typeof createTrendInsight;
  deleteTrendInsightsByProjectId?: typeof deleteTrendInsightsByProjectId;
  generateStructuredOutput?: typeof generateStructuredOutput;
}

const TREND_SOURCE_TYPES = [
  "user_provided",
  "reference_descriptions",
  "mixed",
  "fallback",
] as const;

function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Trend input ${fieldName} must be a string`);
  }

  return value.trim() || undefined;
}

function optionalStringArray(value: unknown, fieldName: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`Trend input ${fieldName} must be a string array`);
  }

  return value;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`Trend output ${fieldName} must be a string array`);
  }

  return value;
}

export async function runTrendStructuring(
  input: TrendStructuringWorkerInput,
  dependencies: TrendStructuringDependencies = {},
) {
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const createInsight =
    dependencies.createTrendInsight ?? createTrendInsight;
  const deleteInsights =
    dependencies.deleteTrendInsightsByProjectId ??
    deleteTrendInsightsByProjectId;
  const generateOutput =
    dependencies.generateStructuredOutput ?? generateStructuredOutput;

  const product = await getProduct(input.project_id);
  if (!product) {
    throw new Error(`Product not found for project ${input.project_id}`);
  }

  const trendText = optionalString(input.payload.trend_text, "trend_text");
  const referenceDescriptions = optionalStringArray(
    input.payload.reference_descriptions,
    "reference_descriptions",
  );
  const referenceLinks = optionalStringArray(
    input.payload.reference_links,
    "reference_links",
  );
  const fallbackRequested =
    input.payload.fallback === true ||
    (!trendText && referenceDescriptions.length === 0);

  const output = await generateOutput({
    template_name: "trend_structuring.md",
    input_payload: {
      product,
      trend_text: trendText ?? null,
      reference_descriptions: referenceDescriptions,
      fallback_flag: fallbackRequested,
      target_platform: input.payload.target_platform ?? "TikTok",
    },
    required_fields: [
      "source_type",
      "fallback_used",
      "hook_patterns",
      "content_structures",
      "pacing_patterns",
      "ad_formulas",
      "visual_patterns",
      "audio_or_caption_patterns",
      "applicability_notes",
      "risk_notes",
    ],
    enum_constraints: {
      source_type: TREND_SOURCE_TYPES,
    },
  });

  if (
    typeof output.source_type !== "string" ||
    !TREND_SOURCE_TYPES.includes(
      output.source_type as (typeof TREND_SOURCE_TYPES)[number],
    )
  ) {
    throw new Error("Trend output source_type is invalid");
  }
  if (typeof output.fallback_used !== "boolean") {
    throw new Error("Trend output fallback_used must be a boolean");
  }

  const applicabilityNotes = requireStringArray(
    output.applicability_notes,
    "applicability_notes",
  );
  const isFallback = fallbackRequested || output.fallback_used === true;

  await deleteInsights(input.project_id);
  const insight = await createInsight({
    project_id: input.project_id,
    hook_patterns: requireStringArray(
      output.hook_patterns,
      "hook_patterns",
    ),
    content_structures: requireStringArray(
      output.content_structures,
      "content_structures",
    ),
    pacing_patterns: requireStringArray(
      output.pacing_patterns,
      "pacing_patterns",
    ),
    emotional_angles: optionalStringArray(
      output.emotional_angles,
      "emotional_angles",
    ),
    visual_patterns: requireStringArray(
      output.visual_patterns,
      "visual_patterns",
    ),
    ad_formulas: requireStringArray(output.ad_formulas, "ad_formulas"),
    trend_source: isFallback ? "fallback" : output.source_type,
    source_text: trendText ?? null,
    reference_links: referenceLinks,
    is_fallback: isFallback,
    summary:
      applicabilityNotes.length > 0
        ? applicabilityNotes.join(" ")
        : null,
  });

  return {
    project_id: input.project_id,
    trend_insight_id: insight.id,
    is_fallback: isFallback,
    trend_source: isFallback ? "fallback" : output.source_type,
  };
}
