export type EnumConstraints = Readonly<
  Record<string, readonly unknown[]>
>;

export interface OutputValidationResult {
  success: boolean;
  errors: string[];
}

export function validateRequiredFields(
  output: unknown,
  requiredFields: readonly string[],
  enumConstraints: EnumConstraints = {},
): OutputValidationResult {
  if (
    typeof output !== "object" ||
    output === null ||
    Array.isArray(output)
  ) {
    return {
      success: false,
      errors: ["Output must be a JSON object"],
    };
  }

  const record = output as Record<string, unknown>;
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  for (const [field, allowedValues] of Object.entries(enumConstraints)) {
    if (
      Object.prototype.hasOwnProperty.call(record, field) &&
      !allowedValues.some((allowedValue) =>
        Object.is(allowedValue, record[field]),
      )
    ) {
      errors.push(
        `Invalid value for ${field}: expected one of ${allowedValues
          .map((value) => JSON.stringify(value))
          .join(", ")}`,
      );
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}
