import { $ } from "bun";

export async function openProjectInCursor(
  absolutePath: string,
  filepath?: string
): Promise<void> {
  console.log(
    "🚀 | openProjectInCursor | absolutePath:",
    absolutePath,
    filepath
  );
  try {
    if (filepath) {
      // Execute the cursor command with the provided absolutePath
      await $`cursor ${absolutePath} ${absolutePath + "/" + filepath}`;
    } else {
      await $`cursor ${absolutePath}`;
    }
    console.log(`Successfully opened project in Cursor: ${absolutePath}`);
  } catch (error) {
    console.error(`Failed to open project in Cursor: ${error}`);
    throw error;
  }
}
