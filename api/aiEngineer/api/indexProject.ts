import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { db } from "../db/db.server";
import { processFileContents } from "../fs/getFileContent";
import { getProjectFiles } from "../fs/getProjectFiles";
import { summarizeCodeFile } from "../llm/summarizeCodeFile";

export const indexProject = async (
  projectId: string,
  options?: { forceSummarize: boolean }
) => {
  const project = await await db.getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  // Delete any existing files for the project;
  await db.deleteProjectFiles(projectId);

  let processProjectFile = async (filepath: string, content: string) => {
    let summarization = "";
    // Force the summary?
    let shouldSummarize = options?.forceSummarize;
    // If not skip the summary if we already have one
    if (!shouldSummarize) {
      let dbFile = await db.getFileByFilepath(project.id, filepath);
      shouldSummarize = filepath.includes("/") && !dbFile?.summary;
    }

    if (shouldSummarize) {
      // Check if filepath has a parent folder
      summarization = await summarizeCodeFile(filepath, content, {
        llm: getLLM("openai", "gpt-4o-mini"),
      });
    }
    return db.saveProjectFile({
      summary: summarization,
      projectId,
      filepath,
      content,
    });
  };

  let projectFiles = await getProjectFiles(project);
  let fileRecords = await processFileContents(
    projectFiles,
    project.absolute_path,
    processProjectFile
  );

  return {
    projectId,
    files: projectFiles,
  };
};
