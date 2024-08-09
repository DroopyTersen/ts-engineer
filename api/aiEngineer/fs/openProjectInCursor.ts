import { $ } from "bun";

export async function openProjectInCursor(absolutePath: string): Promise<void> {
  console.log("🚀 | openProjectInCursor | absolutePath:", absolutePath);
  try {
    // Execute the cursor command with the provided absolutePath
    await $`cursor ${absolutePath}`;
    console.log(`Successfully opened project in Cursor: ${absolutePath}`);
  } catch (error) {
    console.error(`Failed to open project in Cursor: ${error}`);
    throw error;
  }
}
