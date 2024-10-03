import { estimateTokenCost } from "~/toolkit/ai/utils/token.utils";
import { AsyncReturnType } from "~/toolkit/utils/typescript.utils";
import { db } from "../db/db.server";
import { filesToMarkdown } from "../fs/filesToMarkdown";
import { DEFAULT_EXCLUSIONS, getProjectFiles } from "../fs/getProjectFiles";
import { sortFilesByLargest } from "../fs/sortFilesByLargest";

export async function getProject(
  id: string,
  selectedFiles: string[] = [],
  config?: { traceId?: string }
) {
  const project = await await db.getProjectById(id);
  if (!project) {
    throw new Error("Project not found");
  }
  let filepaths = selectedFiles;
  if (!filepaths?.length) {
    filepaths = await getProjectFiles(project);
  }

  let markdown = await filesToMarkdown(filepaths, {
    projectPath: project.absolute_path,
    maxTokens: 100_000,
    maxLinesPerFile: 300,
  });
  let largestFiles = (
    await sortFilesByLargest(filepaths, project.absolute_path)
  ).slice(0, 10);

  // The accuracte countTokens takes too long (10ms at least usuallly)
  let estimatedTokens = project.summary.length + markdown.length / 4;

  const usageEstimate = {
    tokens: estimatedTokens + 1000, // Input + Output tokens
    cost: estimateTokenCost(estimatedTokens, 1000),
  };
  project.summary = project.summary.trim();

  return {
    ...project,
    largestFiles,
    exclusions: project.exclusions || DEFAULT_EXCLUSIONS.join("\n"),
    usageEstimate,
    filepaths,
  };
}

export type CodeProject = AsyncReturnType<typeof getProject>;
