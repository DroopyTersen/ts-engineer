import { processFileContents } from "./getFileContent";

export async function filesToMarkdown(
  filePaths: string[],
  options: {
    projectPath: string;
    maxTokens: number;
    maxLinesPerFile: number;
  }
) {
  let allFileContents = await getFileContents(filePaths, options);

  return `
${formatFileStructure(filePaths)}

## Files

${allFileContents.join("\n\n")}`.trim();
}

export const getFileContents = async (
  filePaths: string[],
  options: {
    projectPath: string;
    maxTokens?: number;
    maxLinesPerFile?: number;
  }
) => {
  let totalChars = 0;
  let maxTokens = options?.maxTokens || 100_000;
  let maxLinesPerFile = options?.maxLinesPerFile || 300;
  let fileContents = await processFileContents(
    filePaths,
    options?.projectPath,
    (filepath, content) => {
      totalChars += content.length;
      if (totalChars / 4 > maxTokens) {
        return null;
      }
      return formatFileContent(filepath, content, maxLinesPerFile);
    }
  );
  return fileContents.filter(Boolean) as string[];
};

// Only shows the first 300 lines of the file
export const formatFileContent = (
  filepath: string,
  content: string,
  maxLines: number = 300
) => {
  let firstNLines = content.split("\n").slice(0, maxLines).join("\n");
  let fileExtension = filepath.split(".").pop() || "";
  return `
${filepath}
\`\`\`${fileExtension}
${firstNLines}
\`\`\`
`;
};

export const formatFileStructure = (filePaths: string[]) => {
  return `
## File Structure

\`\`\`
${filePaths.join("\n")}
\`\`\`
`;
};
