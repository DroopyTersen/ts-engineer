import { $ } from "bun";
import pathUtils from "node:path";
import { filterFilePaths } from "./filterFilePaths";
// Array of file extensions to exclude from processing
const DEFAULT_EXCLUSIONS: string[] = [
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
];

export async function getProjectFiles(
  absolutePath: string,
  options?: { includes?: string[]; excludes?: string[] }
) {
  console.log("🚀 | getProjectFiles | absolutePath:", absolutePath);
  let mergedOptions = {
    excludes: DEFAULT_EXCLUSIONS,
    ...options,
  };
  // We need to look at both committed and unstaged stages
  const output =
    await $`cd ${absolutePath} && git ls-files --exclude-standard -c && git ls-files --others --exclude-standard`.text();

  let files = output.trim().split("\n");

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

  // Foreach file, ensure it actually exists.
  // there could have been a move or rename that hasn't been committed.
  files = (await Promise.all(
    files.map(async (file) => {
      let filepath = pathUtils.join(absolutePath, file);
      const exists = await Bun.file(filepath).exists();
      return exists ? file : null;
    })
  ).then((files) => files.filter(Boolean))) as string[];

  // Sort files, placing root files at the top
  files = files.sort((a, b) => {
    const isRootFileA = !a.includes("/");
    const isRootFileB = !b.includes("/");

    if (isRootFileA && !isRootFileB) return 1;
    if (!isRootFileA && isRootFileB) return -1;

    // If both are root files or both are not, sort alphabetically
    return a.localeCompare(b);
  });

  return files;
}
