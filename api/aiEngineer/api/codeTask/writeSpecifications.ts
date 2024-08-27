import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";
import { classifyCodeTask } from "../../llm/specfications/classifyCodeTask";

import { generateSpecifications } from "api/aiEngineer/llm/specfications/generateSpecifications";
import { getProject } from "../getProject";
import { rankFilesForContext } from "../rankFilesForContext";

export const WriteSpecificationsInput = z.object({
  codeTaskId: z.string(),
  input: z.string(),
  specifications: z.string().optional(),
  projectId: z.string(),
  // todo: wire this up to the llm call
  followupInstructions: z.string().optional(),
  selectedFiles: z.array(z.string()).optional(),
});

export type WriteSpecificationsInput = z.infer<typeof WriteSpecificationsInput>;

export const writeSpecifications = async (
  rawInput: WriteSpecificationsInput,
  {
    llm,
    emitter,
  }: {
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const validatedInput = WriteSpecificationsInput.parse(rawInput);
  const project = await getProject(validatedInput.projectId);

  const fileContents = await getRelevantFilesContents({
    userInput: validatedInput.input,
    project,
    selectedFiles: project.filepaths,
  });
  const fileStructure = formatFileStructure(project.filepaths);
  llm = llm || getLLM("anthropic", "claude-3-5-sonnet-20240620");
  // Classify the code task
  const taskType = await classifyCodeTask(validatedInput.input, {
    llm,
    emitter,
  });
  // Prepare context for spec writing
  const specifications = await generateSpecifications(
    {
      projectContext: {
        absolutePath: project.absolute_path,
        title: project.name,
        summary: project.summary,
        fileStructure,
        fileContents,
      },
      codeTask: {
        input: validatedInput.input,
        specifications: validatedInput.specifications,
        followupInstructions: validatedInput.followupInstructions,
        taskType,
      },
    },
    {
      llm,
      emitter,
    }
  );

  return {
    specifications,
  };
};

export const getRelevantFilesContents = async ({
  userInput,
  selectedFiles,
  project,
  maxTokens = 40_000,
  minScore = 3,
}: {
  userInput: string;
  project: {
    id: string;
    absolute_path: string;
  };
  selectedFiles?: string[];
  maxTokens?: number;
  minScore?: number;
}) => {
  let filepathsForContext = [];
  // if the user selected the files, use them unless there are too many
  if (selectedFiles && selectedFiles.length > 0 && selectedFiles.length < 30) {
    filepathsForContext = selectedFiles;
  } else {
    // use an LLM to rank which files are most relevant
    console.log("🚀 | ranking files for context...");
    let rankedFiles = await rankFilesForContext({
      codeTask: userInput,
      projectId: project.id,
      selectedFiles: selectedFiles,
    });
    filepathsForContext = rankedFiles.results
      .filter((r) => r.score >= minScore)
      .map((r) => r.filepath);
  }
  console.log("🚀 | filepathsForContext:", filepathsForContext.join("\n"));
  return getFileContents(filepathsForContext, project.absolute_path, maxTokens);
};
