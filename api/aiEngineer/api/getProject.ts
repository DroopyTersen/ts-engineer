import { countTokens, estimateTokenCost } from "~/toolkit/ai/utils/token.utils";
import { AsyncReturnType } from "~/toolkit/utils/typescript.utils";
import { db } from "../db/db.server";
import { filesToMarkdown } from "../fs/filesToMarkdown";
import { DEFAULT_EXCLUSIONS, getProjectFiles } from "../fs/getProjectFiles";

export async function getProject(id: string) {
  const project = await db.getProjectById(id);
  if (!project) {
    throw new Error("Project not found");
  }
  console.log(
    "🚀 | getProject | project.absolute_path:",
    project.absolute_path
  );
  let exclusions = project.exclusions
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (exclusions.length === 0) {
    exclusions = DEFAULT_EXCLUSIONS;
  }
  let filepaths = await getProjectFiles(project.absolute_path, {
    excludes: exclusions,
  });
  let markdown = await filesToMarkdown(filepaths, project.absolute_path);
  let estimatedTokens = countTokens(markdown);

  const usageEstimate = {
    tokens: estimatedTokens + 1000, // Input + Output tokens
    cost: estimateTokenCost(estimatedTokens, 1000),
  };
  return {
    ...project,
    exclusions: project.exclusions || DEFAULT_EXCLUSIONS.join("\n"),
    usageEstimate,
    filepaths,
  };
}

export type CodeProject = AsyncReturnType<typeof getProject>;
