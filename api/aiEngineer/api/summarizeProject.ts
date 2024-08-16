import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { db } from "../db/db.server";
import { filesToMarkdown } from "../fs/filesToMarkdown";
import { summarizeProjectMarkdown } from "../llm/summarizeProjectMarkdown";
import { getProject } from "./getProject";

export const summarizeProject = async (
  projectId: string,
  emitter?: LLMEventEmitter
) => {
  let project = await getProject(projectId);
  let codebaseMarkdown = await filesToMarkdown(
    project.filepaths,
    project.absolute_path
  );
  let summary = await summarizeProjectMarkdown(codebaseMarkdown, emitter);
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
