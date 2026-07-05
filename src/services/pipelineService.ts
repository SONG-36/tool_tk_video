import { listAssetsByProjectId } from "../repositories/assetRepository.js";
import { findProductByProjectId } from "../repositories/productRepository.js";
import {
  findProjectById,
  updateProjectCurrentStep,
  updateProjectStatus,
} from "../repositories/projectRepository.js";
import { enqueuePipelineStep } from "../pipeline/orchestrator.js";
import { getFirstPipelineStep } from "../pipeline/pipelineSteps.js";
import { createAppError } from "../utils/errors.js";

export interface StartPipelineInput {
  project_id: string;
  user_id: string;
}

interface PipelineServiceDependencies {
  findProjectById?: typeof findProjectById;
  findProductByProjectId?: typeof findProductByProjectId;
  listAssetsByProjectId?: typeof listAssetsByProjectId;
  updateProjectStatus?: typeof updateProjectStatus;
  updateProjectCurrentStep?: typeof updateProjectCurrentStep;
  enqueuePipelineStep?: typeof enqueuePipelineStep;
}

function requireText(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw createAppError({
      errorCode: "INVALID_PIPELINE_INPUT",
      message: `${fieldName} is required`,
      statusCode: 400,
    });
  }
}

function needsUserInputError(reason: "missing_product" | "missing_asset") {
  return createAppError({
    errorCode: "PIPELINE_NEEDS_USER_INPUT",
    message:
      reason === "missing_product"
        ? "A Product is required before starting the Pipeline"
        : "At least one Asset is required before starting the Pipeline",
    details: { reason },
    statusCode: 409,
  });
}

export async function startPipeline(
  input: StartPipelineInput,
  dependencies: PipelineServiceDependencies = {},
) {
  requireText(input.project_id, "project_id");
  requireText(input.user_id, "user_id");

  const getProject = dependencies.findProjectById ?? findProjectById;
  const getProduct =
    dependencies.findProductByProjectId ?? findProductByProjectId;
  const listAssets = dependencies.listAssetsByProjectId ?? listAssetsByProjectId;
  const setProjectStatus =
    dependencies.updateProjectStatus ?? updateProjectStatus;
  const setProjectCurrentStep =
    dependencies.updateProjectCurrentStep ?? updateProjectCurrentStep;
  const enqueueFirstStep =
    dependencies.enqueuePipelineStep ?? enqueuePipelineStep;

  const project = await getProject(input.project_id);

  if (!project) {
    throw createAppError({
      errorCode: "PROJECT_NOT_FOUND",
      message: "Project not found",
      statusCode: 404,
    });
  }

  if (project.user_id !== input.user_id) {
    throw createAppError({
      errorCode: "PROJECT_ACCESS_DENIED",
      message: "user_id does not own this Project",
      statusCode: 403,
    });
  }

  const product = await getProduct(input.project_id);
  if (!product) {
    await setProjectStatus(input.project_id, "needs_user_input");
    throw needsUserInputError("missing_product");
  }

  const assets = await listAssets(input.project_id);
  if (assets.length === 0) {
    await setProjectStatus(input.project_id, "needs_user_input");
    throw needsUserInputError("missing_asset");
  }

  const firstStep = getFirstPipelineStep();

  await setProjectStatus(input.project_id, "processing");
  await setProjectCurrentStep(input.project_id, "asset_understanding");

  return enqueueFirstStep({
    project_id: input.project_id,
    task_type: firstStep,
    payload: {
      requested_by: input.user_id,
    },
  });
}
