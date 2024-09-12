import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { wait } from "~/toolkit/utils/wait";
import { getFileContent } from "../fs/getFileContent";
import { scoreFileRelevancy } from "../llm/scoreFileRelevancy";

export const rankFilesForContext = async (input: {
  codeTask: string;
  project: { absolute_path: string; summary?: string; filepaths: string[] };
  selectedFiles?: string[];
  minScore?: number;
}) => {
  const files = input.selectedFiles || input.project.filepaths;

  let fileStructure = input.project.filepaths.join("\n");
  let processFile = async (filepath: string, index: number) => {
    await wait(50 * index);
    // console.log("🚀 | rankFilesForContext | filepath:", filepath);
    let fileContent = await getFileContent(
      filepath,
      input.project.absolute_path
    );
    let score = await scoreFileRelevancy(
      {
        file: {
          filepath,
          content: fileContent?.slice(0, 4000 * 4),
        },
        codeTask: input.codeTask,

        fileStructure,
        // projectSummary: input.project?.summary?.substring(0, 10_000),
      },
      {
        llm: getLLM("openai", "gpt-4o-mini"),
      }
    );
    console.log("🚀 | processFile | score:", score, filepath);
    return {
      filepath,
      score,
    };
  };
  let results = await Promise.all(files.map(processFile));
  results.sort((a, b) => b.score - a.score);
  console.timeEnd("scoreFileRelevancy");
  return {
    results: results.filter((r) => r.score >= (input.minScore || 0)),
  };
};
