import { isPipelineStep } from "../pipeline/pipelineSteps.js";
import type { TaskType } from "../schemas/enums.js";
import { runAssetGapDetection } from "./assetGapDetectionWorker.js";
import { runAssetUnderstanding } from "./assetUnderstandingWorker.js";
import { runExportAssembly } from "./exportAssemblyWorker.js";
import { runModelPromptGeneration } from "./modelPromptGenerationWorker.js";
import { runScriptGeneration } from "./scriptGenerationWorker.js";
import { runShotBreakdown } from "./shotBreakdownWorker.js";
import { runShotClassification } from "./shotClassificationWorker.js";
import { runTrendStructuring } from "./trendStructuringWorker.js";

export type WorkerJsonValue =
  | string
  | number
  | boolean
  | { [key: string]: WorkerJsonValue }
  | WorkerJsonValue[];

export interface WorkerHandlerInput {
  project_id: string;
  payload: Record<string, WorkerJsonValue>;
}

export type WorkerHandlerOutput = WorkerJsonValue | undefined;

export type WorkerHandler = (
  input: WorkerHandlerInput,
) => WorkerHandlerOutput | Promise<WorkerHandlerOutput>;

const IMPLEMENTED_HANDLERS: Partial<Record<TaskType, WorkerHandler>> = {
  asset_understanding: runAssetUnderstanding,
  asset_gap_detection: runAssetGapDetection,
  trend_structuring: runTrendStructuring,
  script_generation: runScriptGeneration,
  shot_breakdown: runShotBreakdown,
  shot_classification: runShotClassification,
  model_prompt_generation: runModelPromptGeneration,
  export_assembly: runExportAssembly,
};

function createNotImplementedHandler(taskType: TaskType): WorkerHandler {
  return () => {
    throw new Error(`Worker handler for ${taskType} is not implemented yet.`);
  };
}

export function getWorkerHandler(taskType: string): WorkerHandler {
  if (!isPipelineStep(taskType)) {
    throw new Error(`Unknown Worker task_type: ${taskType}`);
  }

  return IMPLEMENTED_HANDLERS[taskType] ?? createNotImplementedHandler(taskType);
}
