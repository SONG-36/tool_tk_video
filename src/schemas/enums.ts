export const PROJECT_STATUS = [
  "draft",
  "ready",
  "processing",
  "needs_user_input",
  "completed",
  "failed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const PROJECT_CURRENT_STEP = [
  "project_created",
  "asset_understanding",
  "asset_gap_detecting",
  "trend_structuring",
  "script_generating",
  "shot_breaking_down",
  "shot_classifying",
  "prompt_generating",
  "exporting",
  "completed",
  "failed",
] as const;

export type ProjectCurrentStep = (typeof PROJECT_CURRENT_STEP)[number];

export const ASSET_TYPE = [
  "product_image",
  "product_video",
  "usage_video",
  "hand_demo_video",
  "lifestyle_image",
  "lifestyle_video",
  "packaging_image",
  "logo",
  "competitor_ad",
  "reference_video",
] as const;

export type AssetType = (typeof ASSET_TYPE)[number];

export const ASSET_STATUS = [
  "uploaded",
  "processing",
  "analyzed",
  "failed",
] as const;

export type AssetStatus = (typeof ASSET_STATUS)[number];

export const ASSET_GAP_STAGE = [
  "pre_script",
  "post_shot",
] as const;

export type AssetGapStage = (typeof ASSET_GAP_STAGE)[number];

export const RISK_LEVEL = [
  "low",
  "medium",
  "high",
  "blocking",
] as const;

export type RiskLevel = (typeof RISK_LEVEL)[number];

// MVP data context does not freeze Script status values yet.
export type ScriptStatus = string;

export const SHOT_TYPE = [
  "REAL",
  "AI",
  "HYBRID",
  "PRODUCT",
  "TEXT",
] as const;

export type ShotType = (typeof SHOT_TYPE)[number];

export const VIDEO_MODEL = [
  "kling",
  "seedance",
  "jimeng",
] as const;

export type VideoModel = (typeof VIDEO_MODEL)[number];

// MVP data context does not freeze ExportPackage status values yet.
export type ExportPackageStatus = string;

export const TASK_STATUS = [
  "pending",
  "queued",
  "processing",
  "success",
  "failed",
  "retrying",
  "needs_user_input",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_TYPE = [
  "asset_understanding",
  "asset_gap_detection",
  "trend_structuring",
  "script_generation",
  "shot_breakdown",
  "shot_classification",
  "model_prompt_generation",
  "export_assembly",
] as const;

export type TaskType = (typeof TASK_TYPE)[number];
