import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";
import { classifyCodeTask } from "../../llm/specfications/classifyCodeTask";

import { db } from "api/aiEngineer/db/db.server";
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
  let existingCodeTask = await db.getCodeTaskById(validatedInput.codeTaskId);

  const relevantFilePaths = await getRelevantFiles({
    userInput: validatedInput.input,
    project,
    selectedFiles:
      validatedInput.selectedFiles ||
      existingCodeTask?.selected_files ||
      project.filepaths,
  });

  let fileContents = await getFileContents(
    relevantFilePaths,
    project.absolute_path,
    40_000
  );
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

  // Save the code task to the database
  let codeTask;
  if (existingCodeTask) {
    // Update existing code task
    codeTask = await db.updateSpecifications(
      validatedInput.codeTaskId,
      specifications
    );
  } else {
    // Create new code task
    codeTask = await db.createNewCodeTask({
      id: validatedInput.codeTaskId,
      project_id: validatedInput.projectId,
      title: taskType, // Use taskType as the title for now
      input: validatedInput.input,
      specifications,
      selected_files: relevantFilePaths,
      plan: null,
      file_changes: null,
    });
  }

  return {
    specifications,
    codeTaskId: codeTask.id,
  };
};

export const getRelevantFiles = async ({
  userInput,
  selectedFiles,
  project,
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
  return filepathsForContext;
};
