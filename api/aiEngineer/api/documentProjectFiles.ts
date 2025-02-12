import { CodeProjectFile } from "@shared/db.schema";
import { getLLM, LLM } from "~/toolkit/ai/llm/getLLM";
import { modelProviders } from "~/toolkit/ai/llm/modelProviders";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { AsyncQueue } from "~/toolkit/data-structures/AsyncQueue";
import { getFileContent } from "../fs/getFileContent";
import { documentCodeFile } from "../llm/documentCodeFile";
import { getProject } from "./getProject";

async function _documentCodeFile(
  filepath: string,
  projectPath: string,
  options?: {
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
): Promise<CodeProjectFile> {
  let fileContent = await getFileContent(filepath, projectPath);
  if (!fileContent) {
    return {
      filepath,
      documentation: "File not found",
    };
  }
  // If it's a small file, we can just return the content
  let numLines = fileContent.split("\n").length;
  if (numLines < 20) {
    return {
      filepath,
      documentation: fileContent,
    };
  }
  // Use an LLM to summarize/document the file
  let documentation = await documentCodeFile(fileContent, projectPath, {
    llm: options?.llm || getLLM(modelProviders.openai("gpt-4o-mini")),
  });
  return {
    filepath,
    documentation: documentation || "No documentation found",
  };
}
export const documentProject = async (
  projectId: string,
  options?: {
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  let project = await getProject(projectId);
  let queue = new AsyncQueue(10);
  let files = await Promise.all(
    project.filepaths.map(async (filepath) => {
      return queue
        .run(() => _documentCodeFile(filepath, project.absolute_path))
        .then((result) => {
          options?.emitter?.emit(
            "content",
            `${result.filepath}\n${result.documentation}\n\n`
          );
          return result;
        });
    })
  );
  return files;
};
