import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { z } from "zod";
import { getLLM, LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { classifyCodeTask } from "../../llm/specfications/classifyCodeTask";

import { db } from "api/aiEngineer/db/db.server";
import { generateSpecifications } from "api/aiEngineer/llm/specfications/generateSpecifications";
import { telemetry } from "api/telemetry/telemetry.server";
import { getProject } from "../getProject";
import { getRelevantFiles } from "./getRelevantFiles";

export const WriteSpecificationsInput = z.object({
  codeTaskId: z.string(),
  input: z.string(),
  followUpInput: z.string().optional(),
  specifications: z.string().optional(),
  projectId: z.string(),
  selectedFiles: z.array(z.string()).optional(),
});

export type WriteSpecificationsInput = z.infer<typeof WriteSpecificationsInput>;

export const writeSpecifications = async (
  rawInput: WriteSpecificationsInput,
  {
    llm,
    emitter,
    traceId,
  }: {
    traceId?: string;
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const validatedInput = WriteSpecificationsInput.parse(rawInput);
  const project = await getProject(validatedInput.projectId);
  let existingCodeTask = await db.getCodeTaskById(validatedInput.codeTaskId);

  let relevantFilesSpan = traceId
    ? telemetry.createSpan("getRelevantFiles", traceId).start({
        userInput: validatedInput.input,
        project,
        selectedFiles:
          validatedInput.selectedFiles ||
          existingCodeTask?.selected_files ||
          project.filepaths,
      })
    : null;
  const selectedFiles =
    validatedInput.selectedFiles || existingCodeTask?.selected_files || [];
  const { filepaths: relevantFilePaths, stepBackQuestions } =
    await getRelevantFiles({
      userInput: validatedInput.input,
      project,
      selectedFiles,
      parentObservableId: relevantFilesSpan?.id,
      minScore: 3,
    });

  let newSpecifications = `<files>\n${relevantFilePaths.join(
    "\n"
  )}\n</files>\n`;
  if (stepBackQuestions.length > 0) {
    newSpecifications += `<stepback_questions>\n${stepBackQuestions.join(
      "\n"
    )}\n</stepback_questions>\n`;
  }

  emitter?.emit("content", newSpecifications);

  relevantFilesSpan?.end({
    relevantFilePaths,
  });
  let fileContents = await getFileContents(
    relevantFilePaths,
    project.absolute_path,
    70_000
  );
  const fileStructure = formatFileStructure(project.filepaths);
  // llm = llm || getLLM("openai", "gpt-4o-mini");
  llm = llm || getLLM("anthropic", "claude-3-5-sonnet-20240620");
  // llm = llm || getLLM("deepseek", "deepseek-coder");
  // Classify the code task
  const taskType = await classifyCodeTask(validatedInput.input, {
    llm,
    emitter,
  });
  // Prepare context for spec writing
  let { title, specifications } = await generateSpecifications(
    {
      projectContext: {
        absolutePath: project.absolute_path,
        title: project.name,
        summary: project.summary,
        fileStructure,
        fileContents: fileContents,
      },
      codeTask: {
        input: validatedInput.input,
        specifications: validatedInput.specifications,
        followUpInput: validatedInput.followUpInput,
        taskType,
        stepBackQuestions,
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
    codeTask = await db.updateSpecifications({
      codeTaskId: validatedInput.codeTaskId,
      specifications,
      selected_files: selectedFiles ? relevantFilePaths : [],
    });
  } else {
    console.log("🚀 | title:", title);
    codeTask = await db.createNewCodeTask({
      id: validatedInput.codeTaskId,
      project_id: validatedInput.projectId,
      title: `${taskType}: ${title}`,
      input: validatedInput.input,
      specifications,
      selected_files: selectedFiles ? relevantFilePaths : [],
      plan: null,
      file_changes: null,
    });
  }
  return {
    specifications,
    title,
    codeTaskId: codeTask.id,
  };
};
