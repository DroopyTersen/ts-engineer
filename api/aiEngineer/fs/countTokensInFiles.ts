import { formatFileContent, processFileContents } from "./getFileContent";

export const countTokensInFiles = async (input: {
  maxLines?: number;
  absolute_path: string;
  files: string[];
}) => {
  let totalChars = 0;
  let maxTokens = 2_000_000;
  let maxLinesPerFile = input.maxLines || 500;
  await processFileContents(
    input.files,
    input.absolute_path,
    (filepath, content) => {
      let trimmedContent = formatFileContent(
        filepath,
        content,
        maxLinesPerFile
      );
      totalChars += trimmedContent.length;
      if (totalChars / 4 > maxTokens) {
        return null;
      }
      return "throwaway";
    }
  );
  return {
    totalChars,
    numFiles: input.files.length,
    tokens: Math.ceil(totalChars / 4),
    maxLinesPerFile,
  };
};
