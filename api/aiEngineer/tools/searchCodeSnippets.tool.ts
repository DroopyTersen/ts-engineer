import { tool } from "ai";
import { z } from "zod";
import { grepProjectFiles } from "../fs/grepProjectFiles";

export const createSearchCodeSnippetsTool = (absolutePath: string) => {
  return tool({
    description: `Searches the project codebase for relevant code snippets based on a given search string using grep. 
    This tool is essential for exploring the codebase and finding specific implementations, function definitions, 
    or usage patterns. Use it to:
    1. Locate relevant files and code sections quickly.
    2. Find examples of how certain functions or components are used.
    3. Identify potential areas for refactoring or bug fixes.
    4. Discover related code that might be affected by changes.
    
    Tips for effective searching:
    - Use grep-compatible search patterns. For example, to search for "tracer.", use "tracer\\." to escape the dot.
    - Use specific function names, variable names, or unique strings to narrow down results.
    - Try different variations of your search term to catch all relevant instances.
    - Use this tool to decide which files you want to read fully to aid you in your coding task.
    
    Examples of grep-compatible search patterns:
    - "functionName": Search for exact function name
    - "\\bword\\b": Search for whole word matches
    - "pattern1|pattern2": Search for multiple patterns
    - "^import": Search for lines starting with "import"
    - "\\.(js|ts)$": Search for files ending with .js or .ts`,
    parameters: z.object({
      searchString: z
        .string()
        .describe(
          "The grep-compatible search string to use for searching project files."
        ),
    }),
    execute: async (args) => {
      console.log(
        "🚀 | searchCodeSnippets tool: | searchString:",
        args.searchString
      );
      try {
        const results = await grepProjectFiles(absolutePath, args.searchString);
        return formatSearchResults(results);
      } catch (error) {
        console.error("Error searching code snippets:", error);
        return { error: "Failed to search code snippets" };
      }
    },
  });
};

function formatSearchResults(
  results: Array<{
    filepath: string | null;
    lineNumber: string | null;
    snippet: string;
  }>
) {
  return results
    .map(({ filepath, lineNumber, snippet }) => {
      return `File: ${filepath || "Unknown"}${
        lineNumber ? `, Line: ${lineNumber}` : ""
      }
\`\`\`
${snippet}
\`\`\`
`;
    })
    .join("\n\n");
}
