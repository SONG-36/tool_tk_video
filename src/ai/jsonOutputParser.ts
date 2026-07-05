function unwrapMarkdownCodeBlock(rawOutput: string): string {
  const trimmedOutput = rawOutput.trim();
  const codeBlockMatch = trimmedOutput.match(
    /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i,
  );

  return codeBlockMatch?.[1]?.trim() ?? trimmedOutput;
}

export function parseJsonOutput(rawOutput: string): unknown {
  if (rawOutput.trim().length === 0) {
    throw new Error("Failed to parse LLM output: output is empty");
  }

  const jsonText = unwrapMarkdownCodeBlock(rawOutput);

  try {
    return JSON.parse(jsonText) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Failed to parse LLM output as JSON: ${message}`, {
      cause: error,
    });
  }
}
