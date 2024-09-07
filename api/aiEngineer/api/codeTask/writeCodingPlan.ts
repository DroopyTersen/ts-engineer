import { db } from "api/aiEngineer/db/db.server";
import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { telemetry } from "api/telemetry/telemetry.server";
import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";
import { generateCodingPlan } from "../../llm/codingPlan/generateCodingPlan";
import { getProject } from "../getProject";

export const WriteCodingPlanInput = z.object({
  codeTaskId: z.string(),
  projectId: z.string(),
  specifications: z.string(),
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

  const fileContents = await getFileContents(
    existingCodeTask.selected_files || [],
    project.absolute_path,
    40_000
  );
  const fileStructure = formatFileStructure(project.filepaths);

  relevantFilesSpan?.end({
    relevantFilePaths: existingCodeTask.selected_files,
  });

  // llm = llm || getLLM("openai", "gpt-4o-mini");
  llm = llm || getLLM("anthropic", "claude-3-5-sonnet-20240620");

  const codingPlan = await generateCodingPlan(
    {
      projectContext: {
        absolutePath: project.absolute_path,
        title: project.name,
        summary: project.summary,
        fileStructure,
        fileContents,
      },
      codeTask: {
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
