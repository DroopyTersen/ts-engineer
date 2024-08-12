import { filterFilePaths } from "./filterFilePaths";
import { createProjectGit } from "./gitCommands";
// Array of file extensions to exclude from processing
export const DEFAULT_EXCLUSIONS: string[] = [
  "**/*.lockb",
  "**/*.png",
  "**/*.webp",
  "**/*.jpg",
  "**/*.svg",
  "**/*.pdf",
  "**/*.ico",
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/package.json",
  "**/package-lock.json",
  "**/.gitignore",
  "**/.vscode/**",
  "**/data/**",
  "**/.DS_Store",
  "**/public/**",
  "**/*.patch",
];

export async function getProjectFiles({
  absolute_path,
  exclusions = DEFAULT_EXCLUSIONS.join("\n"),
}: {
  absolute_path: string;
  exclusions?: string;
}) {
  console.log("🚀 | getProjectFiles | absolutePath:", absolute_path);
  let git = createProjectGit(absolute_path);
  let excludes = exclusions
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  let files = await git.listFiles();

  files = files.filter((file) => {
    const type = Bun.file(file).type;
    return !type.includes("image") && !file.endsWith(".lockb");
  });

  // Filter out undesired files
  files = filterFilePaths(files, [], excludes);
  console.log("🚀 | files!!!!!:", files.length);

  return files;
}
