import { countTokens, estimateTokenCost } from "~/toolkit/ai/utils/token.utils";
import { AsyncReturnType } from "~/toolkit/utils/typescript.utils";
import { db } from "../db/db.server";
import { filesToMarkdown } from "../fs/filesToMarkdown";
import { DEFAULT_EXCLUSIONS, getProjectFiles } from "../fs/getProjectFiles";

export async function getProject(id: string, selectedFiles: string[] = []) {
  const project = await db.getProjectById(id);
  if (!project) {
    throw new Error("Project not found");
  }
  let filepaths = await getProjectFiles(project);
  let markdown = await filesToMarkdown(
    selectedFiles?.length ? selectedFiles : filepaths,
    project.absolute_path
  );
  let estimatedTokens = countTokens(project.summary + markdown);

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
