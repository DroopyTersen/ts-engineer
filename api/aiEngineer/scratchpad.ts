import { rankFilesForContext } from "./api/rankFilesForContext";
import { db } from "./db/db.server";
import { processFileContents } from "./fs/getFileContent";
import { getProjectFiles } from "./fs/getProjectFiles";

const main = async () => {
  const projectId = "95RUDH";
  const task =
    "What if i want to create a screen under a project that let's a user enter a coding task then have the AI find the most relevant files and hten pass those relevant files to an LLM to genreate a plan to implement the task. Look at how we do the summarize project code for an example of patterns work with LLMs.";
  console.time("rankFilesForContext");
  let results = await rankFilesForContext({
    projectId,
    codeTask: task,
  });
  console.timeEnd("rankFilesForContext");
  results.slice(0, 30).forEach((r) => console.log(`${r.score}: ${r.filepath}`));
};

main();

async function showLargestFiles(projectId: string) {
  let project = await db.getProjectById(projectId);
  let filesList = await getProjectFiles(project);
  let filesWithSizeInfo = await processFileContents(
    filesList,
    project.absolute_path,
    (filepath, content) => {
      let lines = content.split("\n").length;

      return {
        filepath,
        lines,
      };
    }
  );
  // Sort files by number of lines in descending order
  filesWithSizeInfo.sort((a, b) => b.lines - a.lines);

  // Log the sorted files
  console.log("Files sorted by number of lines (descending):");
  filesWithSizeInfo.slice(0, 50).forEach((file) => {
    console.log(`${file.filepath}: ${file.lines} lines`);
  });
}
