import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { chooseModel } from "~/toolkit/ai/llm/modelProviders";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { db } from "../db/db.server";
import { formatFileStructure, getFileContents } from "../fs/getFileContent";
import { generateProjectSummary } from "../llm/summary/generateProjectSummary";
import { getProject } from "./getProject";

export const summarizeProject = async (
  projectId: string,
  emitter?: LLMEventEmitter
) => {
  let project = await getProject(projectId);
  const fileStructure = formatFileStructure(project.filepaths);
  const fileContents = await getFileContents(project.filepaths, {
    projectPath: project.absolute_path,
    maxTokens: 100_000,
    maxLinesPerFile: 300,
  });
  let llm = getLLM(chooseModel(project.classification, "large"));

  let summary = await generateProjectSummary(
    {
      title: project.name,
      summary: project.summary,
      fileStructure,
      fileContents,
    },
    {
      emitter,
      llm,
      // need to throttle it for Azure OpenAI limits
      delayInMs: project.classification === "work" ? 7_000 : 100,
    }
  );
  await db.updateProject({
    id: project.id,
    name: project.name,
    absolute_path: project.absolute_path,
    summary: summary,
    exclusions: project.exclusions,
    test_code_command: project.test_code_command,
    classification: project.classification,
  });
  return summary;
};
