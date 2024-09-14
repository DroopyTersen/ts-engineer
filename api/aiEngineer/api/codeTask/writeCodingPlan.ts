import { db } from "api/aiEngineer/db/db.server";
import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { generateCodingPlan } from "api/aiEngineer/llm/codingPlan/generateCodingPlan";
import { telemetry } from "api/telemetry/telemetry.server";
import { z } from "zod";
import { getLLM, LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getProject } from "../getProject";
import { getRelevantFiles } from "./getRelevantFiles";

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
  const project = await getProject(validatedInput.projectId);
  let existingCodeTask = await db.getCodeTaskById(validatedInput.codeTaskId);

  if (!existingCodeTask) {
    throw new Error("Code task not found");
  }
  let relevantFilesSpan = traceId
    ? telemetry.createSpan("getRelevantFiles", traceId).start({
        codeTaskId: validatedInput.codeTaskId,
        project,
      })
    : null;

  console.log("🚀 | existingCodeTask:", existingCodeTask);
  const selectedFiles = validatedInput.selectedFiles?.length
    ? validatedInput.selectedFiles
    : existingCodeTask?.selected_files || [];
  const { filepaths: relevantFiles } = await getRelevantFiles({
    userInput: validatedInput.specifications,
    project,
    selectedFiles,
    minScore: 3,
    maxTokens: 50_000,
    parentObservableId: relevantFilesSpan?.id,
  });

  const fileContents = await getFileContents(
    relevantFiles,
    project.absolute_path,
    50_000
  );
  const fileStructure = formatFileStructure(project.filepaths);

  relevantFilesSpan?.end({
    relevantFilePaths: relevantFiles,
  });

  // llm = llm || getLLM("openai", "gpt-4o-mini");
  llm = llm || getLLM("anthropic", "claude-3-5-sonnet-20240620");

  let codingPlan: string;

  codingPlan = await generateCodingPlan(
    // codingPlan = await generateCodingPlanWithReasoning(
    {
      projectContext: {
        absolutePath: project.absolute_path,
        title: project.name,
        summary: project.summary,
        fileStructure,
        fileContents,
      },
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
