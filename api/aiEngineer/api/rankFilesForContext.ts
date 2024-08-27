import { getLLM } from "~/toolkit/ai/vercel/getLLM";
import { wait } from "~/toolkit/utils/wait";
import { getFileContent } from "../fs/getFileContent";
import { generateStepBackQuestions } from "../llm/generateStepBackQuestions";
import { scoreFileRelevancy } from "../llm/scoreFileRelevancy";
import { getProject } from "./getProject";

export const rankFilesForContext = async (input: {
  codeTask: string;
  projectId: string;
  selectedFiles?: string[];
}) => {
  let project = await getProject(input.projectId);
  let files = input.selectedFiles || project.filepaths;
  console.time("generateStepBackQuestions");

  let questions = await generateStepBackQuestions(
    {
      codeTask: input.codeTask,
      files,
    },
    {
      llm: getLLM("deepseek", "deepseek-coder"),
    }
  );
  console.log("🚀 | step back questions:", questions);
  let fileStructure = files.join("\n");
  let processFile = async (filepath: string, index: number) => {
    await wait(10 * index);
    let fileContent = await getFileContent(filepath, project.absolute_path);
    let score = await scoreFileRelevancy({
      file: {
        filepath,
        content: fileContent,
      },
      codeTask: input.codeTask,
      questions,
      fileStructure,
      projectSummary: project.summary,
    });
    console.log(`${filepath}: ${score}`);
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
    questions,
  };
};
