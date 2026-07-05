export interface AppError {
  error_code: string;
  message: string;
  details?: unknown;
  status_code: number;
}

interface CreateAppErrorInput {
  errorCode: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export function createAppError({
  errorCode,
  message,
  details,
  statusCode = 500,
}: CreateAppErrorInput): AppError {
  return {
    error_code: errorCode,
    message,
    details,
    status_code: statusCode,
  };
}

export function isAppError(value: unknown): value is AppError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AppError>;

  return (
    typeof candidate.error_code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.status_code === "number"
  );
}
