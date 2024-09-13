import { db } from "api/aiEngineer/db/db.server";
import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/filesToMarkdown";
import { generateCodingPlanWithReasoning } from "api/aiEngineer/llm/codingPlan/generateCodingPlanWithReasoning";
import { telemetry } from "api/telemetry/telemetry.server";
import { z } from "zod";
import { getLLM, LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { generateRevisedCodingPlan } from "../../llm/codingPlan/generateCodingPlan";
import { getProject } from "../getProject";
import { rankFilesForContext } from "../rankFilesForContext";

export const WriteCodingPlanInput = z.object({
  codeTaskId: z.string(),
  projectId: z.string(),
  specifications: z.string(),
  followUpInput: z.string().optional(),
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
  let rankResult = await rankFilesForContext({
    codeTask: validatedInput.specifications,
    project,
    selectedFiles: [],
    minScore: 3,
  });
  console.log("🚀 | rankResult:", rankResult);
  let relevantFiles = rankResult.results.map((r) => r.filepath);
  const fileContents = await getFileContents(
    relevantFiles,
    project.absolute_path,
    60_000
  );
  const fileStructure = formatFileStructure(project.filepaths);

  relevantFilesSpan?.end({
    relevantFilePaths: existingCodeTask.selected_files,
  });

  // llm = llm || getLLM("openai", "gpt-4o-mini");
  llm = llm || getLLM("anthropic", "claude-3-5-sonnet-20240620");

  let codingPlan: string;

  if (validatedInput.followUpInput) {
    codingPlan = await generateRevisedCodingPlan(
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
          previousPlan: existingCodeTask.plan || "",
          followUpInput: validatedInput.followUpInput,
        },
      },
      {
        llm,
        emitter,
      }
    );
  } else {
    codingPlan = await generateCodingPlanWithReasoning(
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
  }

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
