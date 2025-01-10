import { z } from "zod";
import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { classifyCodeTask } from "../../llm/specfications/classifyCodeTask";

import { db } from "api/aiEngineer/db/db.server";
import { getLLMByClassification } from "api/aiEngineer/llm/getLLMByClassification";
import { generateSpecifications } from "api/aiEngineer/llm/specfications/generateSpecifications";
import { getProjectCodeContext } from "./getProjectCodeContext";

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
  let existingCodeTask = await db.getCodeTaskById(validatedInput.codeTaskId);
  let project = await db.getProjectById(validatedInput.projectId);
  llm = llm || getLLMByClassification(project.classification);

  const selectedFiles =
    validatedInput.selectedFiles || existingCodeTask?.selected_files || [];
  let projectContext = await getProjectCodeContext({
    input: validatedInput.input,
    projectId: validatedInput.projectId,
    selectedFiles,
    maxTokens: llm._model.modelId === "deepseek-chat" ? 54_000 : 100_000,
  });

  let newSpecifications = `<files>\n${projectContext.filepaths.join(
    "\n"
  )}\n</files>\n`;

  emitter?.emit("content", newSpecifications);

  // Classify the code task
  const taskType = await classifyCodeTask(validatedInput.input, {
    llm,
    emitter,
  });
  // Prepare context for spec writing
  let { title, specifications } = await generateSpecifications(
    {
      projectContext,
      codeTask: {
        input: validatedInput.input,
        specifications: validatedInput.specifications,
        followUpInput: validatedInput.followUpInput,
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
    console.log("🚀 | title: update specifications", specifications);
    codeTask = await db.updateSpecifications({
      codeTaskId: validatedInput.codeTaskId,
      specifications,
      selected_files: projectContext.filepaths,
    });
  } else {
    console.log("🚀 | title: save new code task", specifications);
    codeTask = await db.createNewCodeTask({
      id: validatedInput.codeTaskId,
      project_id: validatedInput.projectId,
      title: `${taskType}: ${title}`,
      input: validatedInput.input,
      specifications,
      selected_files: projectContext.filepaths,
      plan: null,
      file_changes: null,
    });
  }
  let savedCodeTask = await db.getCodeTaskById(codeTask.id);
  console.log("🚀 | savedCodeTask:", savedCodeTask?.specifications);
  return {
    specifications,
    title,
    codeTaskId: codeTask.id,
  };
};
