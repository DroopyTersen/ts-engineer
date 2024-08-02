import { $ } from "bun";

// Array of file extensions to exclude from processing
const EXCLUDED_EXTENSIONS: string[] = [
  "*.lockb",
  "*.png",
  "*.webp",
  "*.jpg",
  "*.svg",
  "*.pdf",
  "*.ico",
];

export async function getProjectFiles(absolutePath: string) {
  console.log("🚀 | getProjectFiles | absolutePath:", absolutePath);
  const excludedPatterns = EXCLUDED_EXTENSIONS.map((ext) => `':!${ext}'`).join(
    " "
  );

  const output =
    await $`cd ${absolutePath} && git ls-files --exclude-standard -o -c ${excludedPatterns}`
      .quiet()
      .text();

  console.log("🚀 | getProjectFiles | output:", output);

  const files = output.trim().split("\n");
  return files.filter(
    (file) => !EXCLUDED_EXTENSIONS.some((ext) => file.endsWith(ext))
  );
}
