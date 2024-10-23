import pathUtils from "path";
import { parseArgs } from "util";
import {
  formatFileStructure,
  getFileContents,
} from "../api/aiEngineer/fs/filesToMarkdown";
import { filterFilePaths } from "../api/aiEngineer/fs/filterFilePaths";
import { getProjectFiles } from "../api/aiEngineer/fs/getProjectFiles";
import { generateProjectSummary } from "../api/aiEngineer/llm/summary/generateProjectSummary";
import { getLLM } from "../app/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "../app/toolkit/ai/streams/LLMEventEmitter";

const summarizeFolder = async (
  absolutePath: string,
  exclude: string[] = []
) => {
  let filepaths = await getProjectFiles({ absolute_path: absolutePath });

  // Apply the exclude filter
  filepaths = filterFilePaths(filepaths, [], exclude);

  let fileContents = await getFileContents(filepaths, {
    projectPath: absolutePath,
    maxTokens: 100_000,
    maxLinesPerFile: 150,
  });
  let title = absolutePath.split("/").pop();
  let fileStructure = formatFileStructure(filepaths);
  console.log("🚀 | fileStructure:", fileStructure);
  let llm = getLLM("azure", "gpt-4o-mini");
  let emitter = new LLMEventEmitter();
  let totalTokens = (fileContents.join("").length + fileStructure.length) / 4;
  console.log(
    "starting summary with ",
    totalTokens,
    " tokens of source code context.\n\n"
  );
  emitter.on("data", () => {
    process.stdout.write(".");
  });
  process.stdout.write("\nSummarizing...");
  let summary = await generateProjectSummary(
    {
      title,
      fileStructure,
      fileContents,
    },
    {
      // Wait 10 seconds between each section
      delayInMs: llm._model.modelId === "gpt-4o-mini" ? 1000 : 10_000,
      llm,
      emitter,
    }
  );
  Bun.write(`${absolutePath}/AI_SUMMARY.md`, summary);
  console.log("SUMMARY\n", summary);
};

const main = async () => {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      path: {
        type: "string",
      },
      exclude: {
        type: "string",
        multiple: true,
      },
    },
    strict: true,
    allowPositionals: true,
  });
  let path = values.path;
  let excludes = (values.exclude as string[]) || [];
  excludes = excludes.map((exclude) => {
    if (!exclude.startsWith("*")) {
      return `**/${exclude}/**`;
    }
    return exclude;
  });

  if (!path) {
    console.error("Error: --path argument is required.");
    process.exit(1);
  }

  if (!pathUtils.isAbsolute(path)) {
    console.error("Error: The provided path must be an absolute path.");
    process.exit(1);
  }

  if (!Bun.file(path).exists()) {
    console.error(`Error: The path "${path}" does not exist.`);
    process.exit(1);
  }
  excludes.push("**/AI_SUMMARY.md");
  await summarizeFolder(path, excludes);
};

main().catch(console.error);
