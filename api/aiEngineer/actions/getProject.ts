import { CodeProject } from "@shared/db.schema";
import { countTokens, estimateTokenCost } from "~/toolkit/ai/utils/token.utils";
import { db } from "../db/db.server";
import { filesToMarkdown } from "../fs/filesToMarkdown";
import { getProjectFiles } from "../fs/getProjectFiles";
export async function getProject(id: string): Promise<CodeProject> {
  const project = await db.getProjectById(id);
  if (!project) {
    throw new Error("Project not found");
  }
  console.log(
    "🚀 | getProject | project.absolute_path:",
    project.absolute_path
  );
  let files = await getProjectFiles(project.absolute_path);
  let markdown = await filesToMarkdown(files, project.absolute_path);
  let estimatedTokens = countTokens(markdown);

  const usageEstimate = {
    tokens: estimatedTokens + 1000, // Input + Output tokens
    cost: estimateTokenCost(estimatedTokens, 1000),
  };
  return {
    ...project,
    usageEstimate,
    files,
  };
}
