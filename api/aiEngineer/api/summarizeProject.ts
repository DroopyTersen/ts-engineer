import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { db } from "../db/db.server";
import { formatFileStructure, getFileContents } from "../fs/filesToMarkdown";
import { summarizeProjectMarkdown } from "../llm/summary/generateProjectSummary";
import { getProject } from "./getProject";

export const summarizeProject = async (
  projectId: string,
  emitter?: LLMEventEmitter
) => {
  let project = await getProject(projectId);
  const fileStructure = formatFileStructure(project.filepaths);
  const fileContents = await getFileContents(
    project.filepaths,
    project.absolute_path,
    100_000
  );
  let summary = await summarizeProjectMarkdown(
    {
      title: project.name,
      summary: project.summary,
      fileStructure,
      fileContents,
    },
    {
      emitter,
    }
  );
  await await db.updateProject({
    id: project.id,
    name: project.name,
    absolute_path: project.absolute_path,
    summary: summary,
    exclusions: project.exclusions,
    test_code_command: project.test_code_command,
  });
  return summary;
};
