import { defineTemplate } from "~/toolkit/utils/defineTemplate";
import { processFileContents } from "./getFileContent";

export async function filesToMarkdown(filePaths: string[], projectPath = "") {
  let allFileContents = await processFileContents(
    filePaths,
    projectPath,
    (filepath, content) => {
      let fileExtension = filepath.split(".").pop() || "";
      return fileMarkdownTemplate
        .formatString({
          fileExtension,
          filepath,
          content,
        })
        .trim();
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

let fileMarkdownTemplate = defineTemplate(`
{filepath}
\`\`\`{fileExtension}
{content}
\`\`\`
`);
