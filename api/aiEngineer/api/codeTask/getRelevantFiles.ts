import { ProjectClassification } from "@shared/db.schema";
import { generateStepBackQuestions } from "api/aiEngineer/llm/generateStepBackQuestions";
import { telemetry } from "api/telemetry/telemetry.server";
import { traceLLMEventEmitter } from "api/telemetry/traceLLMEventEmitter";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { chooseModel } from "~/toolkit/ai/llm/modelProviders";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { rankFilesForContext } from "../rankFilesForContext";
import { searchCode } from "../searchCode";

export const getRelevantFiles = async ({
  userInput,
  selectedFiles,
  mode = "search",
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
    classification: ProjectClassification;
  };
  mode?: "search" | "score";
  selectedFiles?: string[];
  minScore?: number;
  maxTokens?: number;
  parentObservableId?: string;
}) => {
  let projectFilepaths = project.filepaths;
  let filepathsForContext: string[] = [];
  let stepBackQuestions: string[] = [];

  // if (selectedFiles && selectedFiles.length > 0) {
  //   const totalLength = await processFileContents(
  //     selectedFiles,
  //     project.absolute_path,
  //     (_, content) => content.length
  //   ).then((lengths) => lengths.reduce((sum, length) => sum + length, 0));

  //   console.log(
  //     "🚀 | totalLength:",
  //     totalLength,
  //     maxTokens * 4,
  //     selectedFiles.length
  //   );
  //   if (totalLength <= maxTokens * 4) {
  //     filepathsForContext = selectedFiles;
  //   } else {
  //     console.log("Selected files exceed maxTokens. Using AI ranking.");
  //   }
  // }

  if (!selectedFiles?.length) {
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
        llm: getLLM(chooseModel(project.classification, "small")),
        emitter,
      }
    );
    console.log("🚀 | step back questions:", stepBackQuestions.join("\n"));

    if (mode === "search") {
      let searchResults = await searchCode({
        queries: [userInput, ...stepBackQuestions],
        type: "vector",
        projectId: project.id,
        limit: 25,
      });
      filepathsForContext = searchResults.results.map((r) => r.filepath);
    } else {
      let rankedFiles = await rankFilesForContext({
        codeTask:
          userInput +
          "\n\nStep back questions:\n" +
          stepBackQuestions.join("\n"),
        project,
        selectedFiles: selectedFiles?.length ? selectedFiles : projectFilepaths,
        options: {
          llm: getLLM(chooseModel(project.classification, "small")),
        },
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
  }
  return {
    filepaths: selectedFiles?.length ? selectedFiles : filepathsForContext,
    stepBackQuestions: stepBackQuestions,
  };
};
