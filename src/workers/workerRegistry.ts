import { isPipelineStep } from "../pipeline/pipelineSteps.js";
import type { TaskType } from "../schemas/enums.js";

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

function createNotImplementedHandler(taskType: TaskType): WorkerHandler {
  return () => {
    throw new Error(`Worker handler for ${taskType} is not implemented yet.`);
  };
}

export function getWorkerHandler(taskType: string): WorkerHandler {
  if (!isPipelineStep(taskType)) {
    throw new Error(`Unknown Worker task_type: ${taskType}`);
  }

  return createNotImplementedHandler(taskType);
}
