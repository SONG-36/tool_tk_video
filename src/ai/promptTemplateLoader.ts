import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, realpath } from "node:fs/promises";

const PROMPTS_DIRECTORY = fileURLToPath(
  new URL("../../prompts", import.meta.url),
);

function validateTemplateName(templateName: string): void {
  if (
    templateName.trim().length === 0 ||
    templateName === "." ||
    templateName === ".." ||
    templateName.includes("/") ||
    templateName.includes("\\") ||
    templateName.includes("\0") ||
    path.isAbsolute(templateName)
  ) {
    throw new Error("template_name must be a filename inside the prompts directory");
  }
}

export async function loadPromptTemplate(
  templateName: string,
): Promise<string> {
  validateTemplateName(templateName);

  const templatePath = path.resolve(PROMPTS_DIRECTORY, templateName);

  try {
    const [resolvedPromptsDirectory, resolvedTemplatePath] = await Promise.all([
      realpath(PROMPTS_DIRECTORY),
      realpath(templatePath),
    ]);

    if (path.dirname(resolvedTemplatePath) !== resolvedPromptsDirectory) {
      throw new Error("Prompt template path escapes the prompts directory");
    }

    return await readFile(resolvedTemplatePath, "utf8");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Prompt template path escapes the prompts directory"
    ) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(`Prompt template not found: ${templateName}`);
    }

    throw new Error(`Failed to load prompt template: ${templateName}`, {
      cause: error,
    });
  }
}
