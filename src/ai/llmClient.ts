import { env } from "../config/env.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export interface CallLLMInput {
  system_prompt: string;
  user_prompt: string;
  model?: string;
  temperature?: number;
}

interface LlmClientDependencies {
  fetch?: typeof fetch;
}

interface ProviderError {
  message?: unknown;
}

interface ProviderContent {
  type?: unknown;
  text?: unknown;
}

interface ProviderOutput {
  content?: unknown;
}

interface ProviderResponse {
  status?: unknown;
  error?: ProviderError | null;
  output?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getProviderErrorMessage(value: unknown): string | undefined {
  if (!isRecord(value) || !isRecord(value.error)) {
    return undefined;
  }

  return typeof value.error.message === "string"
    ? value.error.message
    : undefined;
}

function extractOutputText(response: ProviderResponse): string | undefined {
  if (!Array.isArray(response.output)) {
    return undefined;
  }

  const textParts: string[] = [];

  for (const outputItem of response.output as ProviderOutput[]) {
    if (!Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content as ProviderContent[]) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.length > 0 ? textParts.join("") : undefined;
}

export async function callLLM(
  input: CallLLMInput,
  dependencies: LlmClientDependencies = {},
): Promise<string> {
  if (env.AI_API_KEY.trim().length === 0) {
    throw new Error("AI_API_KEY is required to call the LLM provider");
  }

  const fetchProvider = dependencies.fetch ?? fetch;
  const requestBody: Record<string, unknown> = {
    model: input.model ?? env.AI_MODEL_NAME,
    instructions: input.system_prompt,
    input: input.user_prompt,
  };

  if (input.temperature !== undefined) {
    requestBody.temperature = input.temperature;
  }

  let response: Response;

  try {
    response = await fetchProvider(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    throw new Error("LLM provider request failed", { cause: error });
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch (error) {
    throw new Error("LLM provider returned an invalid JSON response", {
      cause: error,
    });
  }

  if (!response.ok) {
    const providerMessage = getProviderErrorMessage(responseBody);
    throw new Error(
      providerMessage
        ? `LLM provider request failed: ${providerMessage}`
        : `LLM provider request failed with status ${response.status}`,
    );
  }

  if (!isRecord(responseBody)) {
    throw new Error("LLM provider response has an invalid shape");
  }

  const providerResponse = responseBody as ProviderResponse;

  if (
    providerResponse.status !== undefined &&
    providerResponse.status !== "completed"
  ) {
    throw new Error(
      `LLM provider response is not completed: ${String(
        providerResponse.status,
      )}`,
    );
  }

  if (providerResponse.error) {
    const message =
      typeof providerResponse.error.message === "string"
        ? providerResponse.error.message
        : "unknown provider error";
    throw new Error(`LLM provider returned an error: ${message}`);
  }

  const outputText = extractOutputText(providerResponse);

  if (outputText === undefined || outputText.trim().length === 0) {
    throw new Error("LLM provider response does not contain text output");
  }

  return outputText;
}
