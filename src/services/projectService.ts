import {
  createProject as createProjectRecord,
  type CreateProjectInput,
} from "../repositories/projectRepository.js";
import { createAppError } from "../utils/errors.js";

export interface CreateProjectServiceInput {
  user_id: string;
  name: string;
  target_platform?: string;
  target_market: string;
  target_language?: string;
  objective?: string;
}

function requireText(value: string | undefined, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw createAppError({
      errorCode: "INVALID_PROJECT_INPUT",
      message: `${fieldName} is required`,
      statusCode: 400,
    });
  }
}

export function createProject(input: CreateProjectServiceInput) {
  requireText(input.user_id, "user_id");
  requireText(input.name, "name");
  requireText(input.target_market, "target_market");

  const data: CreateProjectInput = {
    user_id: input.user_id,
    name: input.name,
    target_platform: input.target_platform,
    target_market: input.target_market,
    target_language: input.target_language,
    objective: input.objective,
    status: "draft",
    current_step: "project_created",
  };

  return createProjectRecord(data);
}
