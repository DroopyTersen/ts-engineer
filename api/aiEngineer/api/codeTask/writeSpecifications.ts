import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";
import { classifyCodeTask } from "../../llm/specfications/classifyCodeTask";

import { db } from "api/aiEngineer/db/db.server";
import { generateStepBackQuestions } from "api/aiEngineer/llm/generateStepBackQuestions";
import { generateSpecifications } from "api/aiEngineer/llm/specfications/generateSpecifications";
import { telemetry } from "api/telemetry/telemetry.server";
import { traceLLMEventEmitter } from "api/telemetry/traceLLMEventEmitter";
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

  const { filepaths: relevantFilePaths, stepBackQuestions } =
    await getRelevantFiles({
      userInput: validatedInput.input,
      project,
      selectedFiles:
        validatedInput.selectedFiles ||
        existingCodeTask?.selected_files ||
        project.filepaths,
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
    20_000
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
        followupInstructions: validatedInput.followupInstructions,
        taskType,
        stepBackQuestions,
      },
    },
    {
      llm,
      emitter,
    }
  );
  specifications = newSpecifications + specifications;
  // Save the code task to the database
  let codeTask;
  if (existingCodeTask) {
    // Update existing code task
    console.log(
      "🚀 | updating existing code task",
      validatedInput.codeTaskId,
      specifications
    );
    codeTask = await db.updateSpecifications(
      validatedInput.codeTaskId,
      specifications
    );
  } else {
    console.log("🚀 | title:", title);
    codeTask = await db.createNewCodeTask({
      id: validatedInput.codeTaskId,
      project_id: validatedInput.projectId,
      title: `${taskType}: ${title}`,
      input: validatedInput.input,
      specifications,
      selected_files: relevantFilePaths,
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

export const getRelevantFiles = async ({
  userInput,
  selectedFiles,
  project,
  minScore = 3,
  parentObservableId,
}: {
  userInput: string;
  project: {
    id: string;
    absolute_path: string;
    summary?: string;
    filepaths: string[];
  };
  selectedFiles?: string[];
  minScore?: number;
  parentObservableId?: string;
}) => {
  let filepathsForContext = [];
  let stepBackQuestions: string[] = [];
  // if the user selected the files, use them unless there are too many
  if (selectedFiles && selectedFiles.length > 0 && selectedFiles.length < 30) {
    filepathsForContext = selectedFiles;
  } else {
    // use an LLM to rank which files are most relevant
    console.log("🚀 | ranking files for context...");
    let emitter = new LLMEventEmitter();
    parentObservableId &&
      traceLLMEventEmitter({
        emitter,
        telemetry: telemetry,
        parentObservableId: parentObservableId,
      });
    stepBackQuestions = await generateStepBackQuestions(
      {
        codeTask: userInput,
        files: project.filepaths,
      },
      {
        // llm: getLLM("deepseek", "deepseek-coder"),
        llm: getLLM("openai", "gpt-4o-mini"),
        emitter,
      }
    );
    console.log("🚀 | step back questions:", stepBackQuestions.join("\n"));
    let rankedFiles = await rankFilesForContext({
      codeTask:
        userInput + "\n\nStep back questions:\n" + stepBackQuestions.join("\n"),
      project,
      selectedFiles: selectedFiles,
    });
    filepathsForContext = rankedFiles.results
      .filter((r) => r.score >= minScore)
      .map((r) => r.filepath);
  }
  console.log("🚀 | filepathsForContext:", filepathsForContext.join("\n"));
  return {
    filepaths: filepathsForContext,
    stepBackQuestions: stepBackQuestions,
  };
};
