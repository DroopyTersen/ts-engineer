import { z } from "zod";
import { runShellCommand } from "./runShellCommand";

const GrepResultItem = z.object({
  filepath: z.string().nullable(),
  lineNumber: z.string().nullable(),
  snippet: z.string(),
});

export const grepProjectFiles = async (
  absolutePath: string,
  grepSearchString: string
) => {
  // Escape double quotes in the search string
  const escapedSearchString = grepSearchString.replace(/"/g, '\\"');

  const command = `
    { git ls-files --exclude-standard -c && git ls-files --others --exclude-standard; } | \
    xargs grep -Hn --color=never -C 1 "${escapedSearchString}" | \
    awk 'BEGIN {RS="--\\n"; ORS="\\n"} {print}' | \
    jq -R -s '
      split("\\n") |
      map(select(length > 0)) |
      map(
        capture("^(?<filepath>[^:]+):(?<lineNumber>[0-9]+):(?<snippet>.*)$") |
        if . == null then
          {filepath: null, lineNumber: null, snippet: input}
        else . end
      ) |
      map(select(.filepath != null))
    '
  `;

  try {
    const jsonString = await runShellCommand(absolutePath, command);
    const result = JSON.parse(jsonString);
    return z.array(GrepResultItem).parse(result);
  } catch (error) {
    console.error("Error in grepProjectFiles:", error);
    throw new Error("Failed to grep project files");
  }
};
