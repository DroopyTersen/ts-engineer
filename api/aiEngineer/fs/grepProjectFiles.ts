import { z } from "zod";
import { runShellCommand } from "./runShellCommand";

const GrepResultItem = z.object({
  filepath: z.string().nullable(),
  lineNumber: z.number().nullable(),
  snippet: z.string(),
});
export type GrepResultItem = z.infer<typeof GrepResultItem>;
export const grepProjectFiles = async (
  absolutePath: string,
  grepSearchString: string
) => {
  const command = `
    { git ls-files --exclude-standard -c && git ls-files --others --exclude-standard; } | \
    xargs grep -in -C 1 "${grepSearchString}"
  `;

  try {
    const grepOutput = await runShellCommand(absolutePath, command);
    let files = grepOutput.split("--").slice(0, 32);
    const result = files.map(processGrepFileResult);
    // console.log("🚀 | result:", result);
    // const parsedResult = z.array(GrepResultItem).parse(result);

    return result;
  } catch (error) {
    console.error("Error in grepProjectFiles:", error);
    throw new Error("Failed to grep project files");
  }
};

/**
app/routes/_index.tsx-1-import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
app/routes/_index.tsx-2-
app/routes/_index.tsx:3:export const loader = async ({}: LoaderFunctionArgs) => {
app/routes/_index.tsx-4-  return redirect("/projects");
app/routes/_index.tsx-5-};
app/routes/_index.tsx-6-
 */
export const processGrepFileResult = (fileResult: string): GrepResultItem => {
  const lines = fileResult.trim().split("\n");
  const matchingLines: ProcessedLine[] = [];
  const allLines: ProcessedLine[] = [];
  let currentFilepath: string | null = null;

  // Regular expressions for matching different line formats
  const matchingLineRegex = /^(\S+):(\d+):(.*)$/;
  const contextLineRegex = /^(\S+)-(\d+)-(.*)$/;

  lines.forEach((line) => {
    const matchResult = line.match(matchingLineRegex);
    const contextMatch = line.match(contextLineRegex);

    if (matchResult) {
      // This is a matching line (contains the search term)
      const [, filepath, lineNumber, content] = matchResult;
      currentFilepath = filepath;
      const processedLine = {
        filepath,
        lineNumber: parseInt(lineNumber, 10),
        content,
      };
      matchingLines.push(processedLine);
      allLines.push(processedLine);
    } else if (contextMatch) {
      // This is a context line (surrounding the matching line)
      const [, , , content] = contextMatch;
      allLines.push({
        filepath: currentFilepath,
        lineNumber: null,
        content,
      });
    } else {
      // This is any other line that doesn't match the expected formats
      allLines.push({
        filepath: currentFilepath,
        lineNumber: null,
        content: line,
      });
    }
  });

  // Construct the final result
  return {
    filepath: matchingLines[0]?.filepath || "",
    lineNumber: matchingLines[0]?.lineNumber || null,
    snippet: allLines.map((line) => line.content).join("\n"),
  };
};

type ProcessedLine = {
  filepath: string | null;
  lineNumber: number | null;
  content: string;
};
