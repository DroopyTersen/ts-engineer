import { processFileContents } from "api/aiEngineer/fs/getFileContent";
import { generateStepBackQuestions } from "api/aiEngineer/llm/generateStepBackQuestions";
import { telemetry } from "api/telemetry/telemetry.server";
import { traceLLMEventEmitter } from "api/telemetry/traceLLMEventEmitter";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { rankFilesForContext } from "../rankFilesForContext";

export const getRelevantFiles = async ({
  userInput,
  selectedFiles,
  project,
  minScore = 3,
  maxTokens = 50_000,
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
  maxTokens?: number;
  parentObservableId?: string;
}) => {
  let projectFilepaths = project.filepaths;
  let filepathsForContext: string[] = [];
  let stepBackQuestions: string[] = [];

  if (selectedFiles && selectedFiles.length > 0) {
    const totalLength = await processFileContents(
      selectedFiles,
      project.absolute_path,
      (_, content) => content.length
    ).then((lengths) => lengths.reduce((sum, length) => sum + length, 0));

    if (totalLength <= maxTokens * 4) {
      filepathsForContext = selectedFiles;
    } else {
      console.log("Selected files exceed maxTokens. Using AI ranking.");
    }
  }

  if (filepathsForContext.length === 0) {
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
        llm: getLLM("openai", "gpt-4o-mini"),
        emitter,
      }
    );
    console.log("🚀 | step back questions:", stepBackQuestions.join("\n"));
    let rankedFiles = await rankFilesForContext({
      codeTask:
        userInput + "\n\nStep back questions:\n" + stepBackQuestions.join("\n"),
      project,
      selectedFiles: selectedFiles?.length ? selectedFiles : projectFilepaths,
    });

    filepathsForContext = rankedFiles.results
      .filter((r) => {
        if (selectedFiles) {
          return true;
        }
        return r.score >= minScore;
      })
      .map((r) => r.filepath);
  }
  console.log("🚀 | filepathsForContext:", filepathsForContext.join("\n"));
  return {
    filepaths: filepathsForContext,
    stepBackQuestions: stepBackQuestions,
  };
};
