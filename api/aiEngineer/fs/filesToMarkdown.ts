import { processFileContents } from "./getFileContent";

export async function filesToMarkdown(filePaths: string[], projectPath = "") {
  let allFileContents = await processFileContents(
    filePaths,
    projectPath,
    (filepath, content) => {
      let first300Lines = content.split("\n").slice(0, 300).join("\n");
      let fileExtension = filepath.split(".").pop() || "";
      return `
${filepath}
\`\`\`${fileExtension}
${first300Lines}
\`\`\`
`;
    }
  );

  return `
## File Structure

\`\`\`
${filePaths.join("\n\n")}
\`\`\`

## Files

${allFileContents.join("\n\n")}`.trim();
}
