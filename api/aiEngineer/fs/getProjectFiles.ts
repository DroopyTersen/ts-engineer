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
];

export async function getProjectFiles(
  absolutePath: string,
  options?: { includes?: string[]; excludes?: string[] }
) {
  console.log("🚀 | getProjectFiles | absolutePath:", absolutePath);
  let git = createProjectGit(absolutePath);
  let mergedOptions = {
    ...options,
    excludes:
      options?.excludes && options?.excludes?.length > 0
        ? options?.excludes
        : DEFAULT_EXCLUSIONS,
  };
  let files = await git.listFiles();
  console.log("🚀 | files!!!!!:", files.length);

  files = files.filter((file) => {
    const type = Bun.file(file).type;
    return !type.includes("image");
  });

  // Filter out undesired files
  files = filterFilePaths(
    files,
    mergedOptions.includes,
    mergedOptions.excludes
  );

  return files;
}
