import { db } from "./db/db.server";
import { processFileContents } from "./fs/getFileContent";
import { getProjectFiles } from "./fs/getProjectFiles";

const main = async () => {
  const projectId = "9Q8F58";
  let project = db.getProjectById(projectId);
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
};

main();
