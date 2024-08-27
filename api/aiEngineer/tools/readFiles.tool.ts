import { tool } from "ai";
import { z } from "zod";
import { formatFileContent } from "../fs/filesToMarkdown";
import { processFileContents } from "../fs/getFileContent";

export const createReadFilesTool = (absolutePath: string) => {
  return tool({
    description:
      "Reads the contents of specified files and returns them as a formatted string. This tool is useful for retrieving and formatting the contents of multiple files in a project.",
    parameters: z.object({
      filepaths: z
        .array(z.string())
        .describe("An array of project relative file paths to read."),
    }),
    execute: async (args) => {
      console.log(
        "🚀 | readFileContents tool: | args:\n",
        args.filepaths.join("\n")
      );
      try {
        const formattedContents = await processFileContents(
          args.filepaths,
          absolutePath,
          formatFileContent
        );
        return formattedContents.join("\n\n");
      } catch (error) {
        console.error("Error reading files:", error);
        return { error: "Failed to read file contents" };
      }
    },
  });
};
