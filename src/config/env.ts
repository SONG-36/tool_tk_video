import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  QUEUE_URL: z.string().trim().min(1).default("redis://localhost:6379"),
  STORAGE_ROOT: z.string().trim().min(1, "STORAGE_ROOT is required"),
  AI_API_KEY: z.string().trim().min(1, "AI_API_KEY is required"),
  AI_MODEL_NAME: z.string().trim().min(1).default("gpt-4.1-mini"),
  ENVIRONMENT: z.string().trim().min(1).default("local"),
  LOG_LEVEL: z.string().trim().min(1).default("debug"),
  MAX_RETRY_COUNT: z.coerce.number().int().positive().default(3),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(50),
  EXPORT_ROOT: z.string().trim().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(3000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => {
      const key = issue.path.join(".") || "env";
      return `${key}: ${issue.message}`;
    })
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

const config = parsedEnv.data;

export const env = {
  ...config,
  EXPORT_ROOT: config.EXPORT_ROOT ?? config.STORAGE_ROOT,
} as const;

export type Env = typeof env;
