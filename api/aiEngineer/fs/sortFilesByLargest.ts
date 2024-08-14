import { processFileContents } from "./getFileContent";

export const sortFilesByLargest = async (
  filepaths: string[],
  absolutePath: string
) => {
  let results = await processFileContents(
    filepaths,
    absolutePath,
    (filepath, content) => {
      return {
        filepath,
        filename: filepath.split("/").pop() || filepath,
        charCount: content.length,
        tokens: content.length / 4,
      };
    }
  );
  let sortedResults = results.sort((a, b) => b.charCount - a.charCount);
  return sortedResults;
};
