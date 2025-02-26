import { z } from "zod";
import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { classifyCodeTask } from "../../llm/specfications/classifyCodeTask";

import { db } from "api/aiEngineer/db/db.server";
import { generateSpecifications } from "api/aiEngineer/llm/specfications/generateSpecifications";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { chooseModel } from "~/toolkit/ai/llm/modelProviders";
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
  llm = llm || getLLM(chooseModel(project.classification, "tools"));

  const selectedFiles =
    validatedInput.selectedFiles || existingCodeTask?.selected_files || [];
  let projectContext = await getProjectCodeContext({
    input: validatedInput.input,
    projectId: validatedInput.projectId,
    selectedFiles,
    maxTokens: llm._model.modelId === "deepseek-chat" ? 54_000 : 70_000,
  });

  let newSpecifications = ` `;

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
    codeTask = await db.updateSpecifications({
      codeTaskId: validatedInput.codeTaskId,
      specifications,
      selected_files: projectContext.filepaths,
    });
  } else {
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
