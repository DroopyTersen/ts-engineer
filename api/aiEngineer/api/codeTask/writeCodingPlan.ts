import { db } from "api/aiEngineer/db/db.server";
import { generateCodingPlan } from "api/aiEngineer/llm/codingPlan/generateCodingPlan";
import { z } from "zod";
import { getLLM, LLM } from "~/toolkit/ai/llm/getLLM";
import { chooseModel } from "~/toolkit/ai/llm/modelProviders";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getProjectCodeContext } from "./getProjectCodeContext";

export const WriteCodingPlanInput = z.object({
  codeTaskId: z.string(),
  projectId: z.string(),
  specifications: z.string(),
  followUpInput: z.string().optional(),
  selectedFiles: z.array(z.string()).optional(),
});

export type WriteCodingPlanInput = z.infer<typeof WriteCodingPlanInput>;

export const writeCodingPlan = async (
  rawInput: WriteCodingPlanInput,
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
  const validatedInput = WriteCodingPlanInput.parse(rawInput);
  let existingCodeTask = await db.getCodeTaskById(validatedInput.codeTaskId);

  if (!existingCodeTask) {
    throw new Error("Code task not found");
  }
  const selectedFiles = validatedInput.selectedFiles?.length
    ? validatedInput.selectedFiles
    : existingCodeTask?.selected_files || [];
  let projectContext = await getProjectCodeContext({
    input: existingCodeTask?.input + existingCodeTask?.specifications,
    projectId: validatedInput.projectId,
    selectedFiles,
    maxTokens: llm?._model.modelId.includes("gemini") ? 300_000 : 70_000,
  });

  console.log("🚀 | existingCodeTask:", existingCodeTask);
  llm =
    llm ||
    getLLM(chooseModel(projectContext.classification || "private", "tools"));

  let codingPlan: string;
  let generateFn = validatedInput.followUpInput
    ? generateCodingPlan
    : generateCodingPlan;
  // : generateCodingPlanWithReasoning;
  // codingPlan = await generateCodingPlan(
  codingPlan = await generateFn(
    {
      projectContext,
      codeTask: {
        followUpInput: validatedInput.followUpInput || "",
        previousPlan: existingCodeTask.plan || "",
        specifications:
          validatedInput.specifications ||
          existingCodeTask?.specifications ||
          "",
        rawInput: existingCodeTask.input,
      },
    },
    {
      llm,
      emitter,
    }
  );

  // Update the existing code task with the coding plan
  const updatedCodeTask = await db.updateCodingPlan({
    codeTaskId: validatedInput.codeTaskId,
    codingPlan,
    specifications: validatedInput.specifications,
  });

  return {
    codingPlan,
    codeTaskId: updatedCodeTask.id,
  };
};
