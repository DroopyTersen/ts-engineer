import { getCachedMessageContent } from "~/toolkit/ai/llm/getLLM";
import { formatFileContent, formatFileStructure } from "./filesToMarkdown";
import { processFileContents } from "./getFileContent";

export async function filesToLLMMessageContents(
  filePaths: string[],
  projectPath = "",
  options: { maxTokens?: number } = { maxTokens: 40_000 }
) {
  let maxTokens = options.maxTokens || 40_000;
  let llmMessageContents = await processFileContents(
    filePaths,
    projectPath,
    (filepath, content) => {
      return getCachedMessageContent(formatFileContent(filepath, content));
    }
  );
  llmMessageContents.unshift(
    getCachedMessageContent(formatFileStructure(filePaths))
  );

  // Calculate total tokens and truncate if necessary
  let totalTokens = 0;
  const truncatedContents = [];
  for (const content of llmMessageContents) {
    const contentTokens = Math.ceil(content.text.length / 4);
    if (totalTokens + contentTokens > maxTokens) break;
    totalTokens += contentTokens;
    truncatedContents.push(content);
  }

  return truncatedContents;
}
