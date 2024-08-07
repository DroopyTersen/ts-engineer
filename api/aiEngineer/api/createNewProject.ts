import { z } from "zod";
import { validateSchema } from "~/toolkit/remix/validateSchema";
import { generateId } from "~/toolkit/utils/generateId";
import { db } from "../db/db.server";
const CreateNewProjectInput = z.object({
  name: z.string().optional(),
  absolutePath: z.string(),
});

export const createNewProject = (formData: FormData) => {
  const userInput = validateSchema(formData, CreateNewProjectInput);
  console.log("🚀 | createNewProject | userInput:", userInput);

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
  };
  let existingProject = db.getProjectByAbsolutePath(project.absolute_path);
  if (existingProject) {
    return existingProject;
  }

  return db.insertProject(project);
};
