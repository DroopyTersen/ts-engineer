import { wait } from "~/toolkit/utils/wait";
import { getFileContent } from "../fs/getFileContent";
import { scoreFileRelevancy } from "../llm/scoreFileRelevancy";

export const rankFilesForContext = async (input: {
  codeTask: string;
  project: { absolute_path: string; summary?: string; filepaths: string[] };
  selectedFiles?: string[];
}) => {
  const files = input.selectedFiles || input.project.filepaths;

  let fileStructure = input.project.filepaths.join("\n");
  let processFile = async (filepath: string, index: number) => {
    await wait(50 * index);
    let fileContent = await getFileContent(
      filepath,
      input.project.absolute_path
    );
    console.log(
      "🚀 | processFile | fileContent:",
      filepath,
      fileContent.slice(0, 100)
    );
    let score = await scoreFileRelevancy({
      file: {
        filepath,
        content: fileContent,
      },
      codeTask: input.codeTask,

      fileStructure,
      // projectSummary: input.project?.summary?.substring(0, 10_000),
    });
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
    results,
  };
};
