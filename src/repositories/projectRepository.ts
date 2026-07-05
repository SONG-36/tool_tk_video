import { prisma } from "../db/client.js";
import type { ProjectCurrentStep, ProjectStatus } from "../schemas/enums.js";

export interface CreateProjectInput {
  user_id: string;
  name: string;
  target_market: string;
  status?: ProjectStatus;
  target_platform?: string;
  target_language?: string;
  objective?: string;
  current_step?: ProjectCurrentStep;
}

export function createProject(data: CreateProjectInput) {
  return prisma.project.create({
    data,
  });
}

export function findProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
}

export function findProjectsByUserId(userId: string) {
  return prisma.project.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
) {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      status,
    },
  });
}

export function updateProjectCurrentStep(
  projectId: string,
  currentStep: ProjectCurrentStep,
) {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      current_step: currentStep,
    },
  });
}
