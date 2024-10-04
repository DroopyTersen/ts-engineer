import { ProjectClassification } from "@shared/db.schema";
import { z } from "zod";
import { validateSchema } from "~/toolkit/remix/validateSchema";
import { generateId } from "~/toolkit/utils/generateId";
import { db } from "../db/db.server";
import { DEFAULT_EXCLUSIONS } from "../fs/getProjectFiles";
const CreateNewProjectInput = z.object({
  name: z.string().optional(),
  absolutePath: z.string(),
  test_code_command: z.string().optional(),
  classification: ProjectClassification.optional(),
});
export type CreateNewProjectInput = z.infer<typeof CreateNewProjectInput>;
export const createNewProject = async (
  input: FormData | CreateNewProjectInput
) => {
  const userInput = validateSchema(input, CreateNewProjectInput);
  // console.log("🚀 | createNewProject | userInput:", userInput);

  // Remove trailing slash from absolutePath if present
  const cleanedPath = userInput.absolutePath.replace(/\/$/, "");

  // Extract the last path segment if no name is provided
  const defaultName = cleanedPath.split("/").pop() || "";

  const project = {
    id: generateId(6),
    name: userInput.name || defaultName,
    absolute_path: cleanedPath,
    summary: "",
    files: [],
    exclusions: DEFAULT_EXCLUSIONS.join("\n"),
    classification: userInput.classification || "private",
    test_code_command: userInput?.test_code_command || "bun run build",
  };
  let existingProject = await db.getProjectByAbsolutePath(
    project.absolute_path
  );
  if (existingProject) {
    return existingProject;
  }

  return await db.insertProject(project);
};
