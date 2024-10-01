import { openProjectInCursor } from "api/aiEngineer/fs/openProjectInCursor";
import { runShellCommand } from "api/aiEngineer/fs/runShellCommand";
import path from "path";
import { db } from "../../db/db.server";
import { getProject } from "../getProject";

export const applyPlan = async (projectId: string, codeTaskId: string) => {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  const codeTask = await db.getCodeTaskById(codeTaskId);
  if (!codeTask || !codeTask.plan) {
    throw new Error("Code task or plan not found");
  }

  // Escape special characters in the coding plan
  const escapedPlan = codeTask.plan
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/'/g, "'\\''"); // Escape single quotes

  // Read and templatize AppleScript
  const scriptPath = path.join(__dirname, "applyPlan.applescript");

  // Open project in Cursor
  openProjectInCursor(project.absolute_path);

  // Execute the AppleScript by pointing to the file path
  await runShellCommand(project.absolute_path, `osascript "${scriptPath}"`);
};
