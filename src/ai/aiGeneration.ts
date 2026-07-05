import {
  callLLM,
  type CallLLMInput,
} from "./llmClient.js";
import { parseJsonOutput } from "./jsonOutputParser.js";
import {
  validateRequiredFields,
  type EnumConstraints,
  type OutputValidationResult,
} from "./outputValidator.js";
import { loadPromptTemplate } from "./promptTemplateLoader.js";

export interface GenerateStructuredOutputInput {
  template_name: string;
  input_payload: unknown;
  required_fields: readonly string[];
  enum_constraints?: EnumConstraints;
  model?: string;
  temperature?: number;
}

interface AiGenerationDependencies {
  loadPromptTemplate?: typeof loadPromptTemplate;
  callLLM?: (input: CallLLMInput) => ReturnType<typeof callLLM>;
  parseJsonOutput?: typeof parseJsonOutput;
  validateRequiredFields?: (
    output: unknown,
    requiredFields: readonly string[],
    enumConstraints?: EnumConstraints,
  ) => OutputValidationResult;
}

function serializeInputPayload(inputPayload: unknown): string {
  try {
    const serialized = JSON.stringify(inputPayload);

    if (serialized === undefined) {
      throw new Error("input_payload is not JSON serializable");
    }

    return serialized;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "input_payload is not JSON serializable"
    ) {
      throw error;
    }

    throw new Error("input_payload is not JSON serializable", {
      cause: error,
    });
  }
}

export async function generateStructuredOutput(
  input: GenerateStructuredOutputInput,
  dependencies: AiGenerationDependencies = {},
): Promise<Record<string, unknown>> {
  const getTemplate =
    dependencies.loadPromptTemplate ?? loadPromptTemplate;
  const generateText = dependencies.callLLM ?? callLLM;
  const parseOutput = dependencies.parseJsonOutput ?? parseJsonOutput;
  const validateOutput =
    dependencies.validateRequiredFields ?? validateRequiredFields;

  const systemPrompt = await getTemplate(input.template_name);
  const userPrompt = serializeInputPayload(input.input_payload);
  const rawOutput = await generateText({
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    model: input.model,
    temperature: input.temperature,
  });
  const parsedOutput = parseOutput(rawOutput);
  const validation = validateOutput(
    parsedOutput,
    input.required_fields,
    input.enum_constraints,
  );

  if (!validation.success) {
    throw new Error(
      `AI output validation failed: ${validation.errors.join("; ")}`,
    );
  }

  return parsedOutput as Record<string, unknown>;
}
