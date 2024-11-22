import { DEFAULT_EXCLUSIONS } from "./DEFAULT_EXCLUSIONS";
import { filterFilePaths } from "./filterFilePaths";
import { createProjectGit } from "./gitCommands";
export async function getProjectFiles({
  absolute_path,
  exclusions = DEFAULT_EXCLUSIONS.join("\n"),
}: {
  absolute_path: string;
  exclusions?: string;
}) {
  let git = createProjectGit(absolute_path);
  let excludes = exclusions
    ? exclusions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_EXCLUSIONS;
  let files = await git.listFiles();

  files = files.filter((file) => {
    const type = Bun.file(file).type;
    return !type.includes("image") && !file.endsWith(".lockb");
  });

  // Filter out undesired files
  files = filterFilePaths(files, [], excludes);

  return files;
}
