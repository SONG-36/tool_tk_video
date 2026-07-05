import {
  enqueueTask,
  type PipelineJobData,
  type TaskPayload,
} from "../queue/queueClient.js";
import {
  createTaskRun,
  type CreateTaskRunInput,
} from "../repositories/taskRunRepository.js";
import type { TaskType } from "../schemas/enums.js";
import { isPipelineStep } from "./pipelineSteps.js";

export interface EnqueuePipelineStepInput {
  project_id: string;
  task_type: TaskType;
  payload?: TaskPayload;
}

interface OrchestratorDependencies {
  createTaskRun?: (
    input: CreateTaskRunInput,
  ) => ReturnType<typeof createTaskRun>;
  enqueueTask?: (jobData: PipelineJobData) => ReturnType<typeof enqueueTask>;
}

export async function enqueuePipelineStep(
  input: EnqueuePipelineStepInput,
  dependencies: OrchestratorDependencies = {},
) {
  if (input.project_id.trim().length === 0) {
    throw new Error("project_id is required");
  }

  if (!isPipelineStep(input.task_type)) {
    throw new Error(`Unknown MVP pipeline step: ${input.task_type}`);
  }

  const payload = input.payload ?? {};
  const createTaskRunRecord = dependencies.createTaskRun ?? createTaskRun;
  const addQueueJob = dependencies.enqueueTask ?? enqueueTask;

  const taskRun = await createTaskRunRecord({
    project_id: input.project_id,
    task_type: input.task_type,
    status: "queued",
    input_ref: payload,
  });

  await addQueueJob({
    task_run_id: taskRun.id,
    project_id: input.project_id,
    task_type: input.task_type,
    payload,
  });

  return taskRun;
}
