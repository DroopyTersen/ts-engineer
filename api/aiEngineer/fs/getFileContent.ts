import fs from "fs/promises";
import { join } from "path";
export const getFileContent = (path: string, absolutePath = "") => {
  try {
    let filepath = path.includes(absolutePath)
      ? path
      : join(absolutePath, path);
    return fs.readFile(filepath, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${path}`, error);
    return "";
  }
};

export const processFileContents = <T>(
  filepaths: string[],
  absolutePath: string,
  process: (filepath: string, content: string) => T
) => {
  return Promise.all(
    filepaths.map(async (filepath) => {
      const content = await getFileContent(filepath, absolutePath);
      return process(filepath, content);
    })
  );
};

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
      let trimmedContent = formatFileContent(
        filepath,
        content,
        maxLinesPerFile
      );
      totalChars += trimmedContent.length;
      if (totalChars / 4 > maxTokens) {
        return null;
      }
      return trimmedContent;
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
  const lines = content.split("\n");
  const totalLines = lines.length;
  let firstNLines = lines.slice(0, maxLines).join("\n");
  let fileExtension = filepath.split(".").pop() || "";

  let output = `
${filepath}
\`\`\`${fileExtension}
${firstNLines}
\`\`\``;

  if (totalLines > maxLines) {
    const remainingLines = totalLines - maxLines;
    output += `\n\n*${remainingLines} lines omitted for brevity, please call the readFileContents tool to view the entire file*`;
  }

  return output;
};

export const formatFileStructure = (filePaths: string[]) => {
  return `
## File Structure

\`\`\`
${filePaths.join("\n")}
\`\`\`
`;
};

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
