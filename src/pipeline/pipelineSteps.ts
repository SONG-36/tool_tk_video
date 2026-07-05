import type { TaskType } from "../schemas/enums.js";

export const MVP_PIPELINE_STEPS = [
  "asset_understanding",
  "asset_gap_detection",
  "trend_structuring",
  "script_generation",
  "shot_breakdown",
  "shot_classification",
  "model_prompt_generation",
  "export_assembly",
] as const satisfies readonly TaskType[];

export type MvpPipelineStep = (typeof MVP_PIPELINE_STEPS)[number];

export function getFirstPipelineStep(): MvpPipelineStep {
  return MVP_PIPELINE_STEPS[0];
}

export function isPipelineStep(value: unknown): value is MvpPipelineStep {
  return (
    typeof value === "string" &&
    MVP_PIPELINE_STEPS.some((step) => step === value)
  );
}

export function getNextPipelineStep(
  currentStep: TaskType,
): MvpPipelineStep | "completed" | null {
  if (!isPipelineStep(currentStep)) {
    return null;
  }

  const currentIndex = MVP_PIPELINE_STEPS.indexOf(currentStep);

  return MVP_PIPELINE_STEPS[currentIndex + 1] ?? "completed";
}
