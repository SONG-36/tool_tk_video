import {
  enqueuePipelineStep,
  type EnqueuePipelineStepInput,
} from "./orchestrator.js";
import { getNextPipelineStep } from "./pipelineSteps.js";
import {
  updateProjectCurrentStep,
  updateProjectStatus,
} from "../repositories/projectRepository.js";
import type {
  ProjectCurrentStep,
  TaskType,
} from "../schemas/enums.js";
import type { TaskPayload } from "../queue/queueClient.js";

export interface AdvanceAfterTaskSuccessInput {
  project_id: string;
  completed_task_type: TaskType;
  payload?: TaskPayload;
}

interface AdvancePipelineDependencies {
  enqueuePipelineStep?: (
    input: EnqueuePipelineStepInput,
  ) => ReturnType<typeof enqueuePipelineStep>;
  updateProjectStatus?: typeof updateProjectStatus;
  updateProjectCurrentStep?: typeof updateProjectCurrentStep;
}

const PROJECT_STEP_BY_TASK: Record<TaskType, ProjectCurrentStep> = {
  asset_understanding: "asset_understanding",
  asset_gap_detection: "asset_gap_detecting",
  trend_structuring: "trend_structuring",
  script_generation: "script_generating",
  shot_breakdown: "shot_breaking_down",
  shot_classification: "shot_classifying",
  model_prompt_generation: "prompt_generating",
  export_assembly: "exporting",
};

export async function advanceAfterTaskSuccess(
  input: AdvanceAfterTaskSuccessInput,
  dependencies: AdvancePipelineDependencies = {},
) {
  const enqueueStep =
    dependencies.enqueuePipelineStep ?? enqueuePipelineStep;
  const setProjectStatus =
    dependencies.updateProjectStatus ?? updateProjectStatus;
  const setProjectCurrentStep =
    dependencies.updateProjectCurrentStep ?? updateProjectCurrentStep;

  const nextStep = getNextPipelineStep(input.completed_task_type);

  if (nextStep === null) {
    throw new Error(
      `Unknown completed Pipeline step: ${input.completed_task_type}`,
    );
  }

  if (nextStep === "completed") {
    await setProjectCurrentStep(input.project_id, "completed");
    await setProjectStatus(input.project_id, "completed");

    return {
      project_id: input.project_id,
      completed: true,
      next_task_type: null,
    };
  }

  await setProjectStatus(input.project_id, "processing");
  await setProjectCurrentStep(
    input.project_id,
    PROJECT_STEP_BY_TASK[nextStep],
  );

  const taskRun = await enqueueStep({
    project_id: input.project_id,
    task_type: nextStep,
    payload: input.payload,
  });

  return {
    project_id: input.project_id,
    completed: false,
    next_task_type: nextStep,
    task_run_id: taskRun.id,
  };
}
