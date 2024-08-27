import { processFileContents } from "./getFileContent";

export async function filesToMarkdown(filePaths: string[], projectPath = "") {
  let allFileContents = await processFileContents(
    filePaths,
    projectPath,
    (filepath, content) => {
      return formatFileContent(filepath, content);
    }
  );

  return `
${formatFileStructure(filePaths)}

## Files

${allFileContents.join("\n\n")}`.trim();
}

export const getFileContents = async (
  filePaths: string[],
  projectPath = "",
  maxTokens = 100_000
) => {
  let totalChars = 0;

  let fileContents = await processFileContents(
    filePaths,
    projectPath,
    (filepath, content) => {
      totalChars += content.length;
      if (totalChars / 4 > maxTokens) {
        return null;
      }
      return formatFileContent(filepath, content);
    }
  );
  return fileContents.filter(Boolean) as string[];
};

export const formatFileContent = (filepath: string, content: string) => {
  let first300Lines = content.split("\n").slice(0, 300).join("\n");
  let fileExtension = filepath.split(".").pop() || "";
  return `
${filepath}
\`\`\`${fileExtension}
${first300Lines}
\`\`\`
`;
};

export const formatFileStructure = (filePaths: string[]) => {
  return `
## File Structure

\`\`\`
${filePaths.join("\n\n")}
\`\`\`
`;
};
