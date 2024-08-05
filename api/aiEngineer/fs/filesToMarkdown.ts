import { join } from "node:path";

export const getFileContent = (filePath: string) => {
  try {
    return Bun.file(filePath).text();
  } catch (error) {
    console.error(`Error reading file ${filePath}`, error);
    return "";
  }
};

export async function filesToMarkdown(filePaths: string[], absolutePath = "") {
  let allFileContents = await Promise.all(
    filePaths.map(async (path, index) => {
      let filepath = path.includes(absolutePath)
        ? path
        : join(absolutePath, path);
      let content = await getFileContent(filepath);
      let fileExtension = path.split(".").pop();
      return `${filePaths[index]}
    
\`\`\`${fileExtension}
${content}
\`\`\`
`;
    })
  );
  return `
## File Structure
\`\`\`
${filePaths.join("\n")}
\`\`\`

## Files

${allFileContents.join("\n\n")}`;
}
