import { z } from "zod";
import { validateSchema } from "~/toolkit/remix/validateSchema";

const UpdateProjectInput = z.object({
  name: z.string().optional(),
  summary: z.string().optional(),
  exclusions: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
  test_code_command: z.string().optional(),
});
export const updateProject = async (projectId: string, formData: FormData) => {
  const userInput = validateSchema(formData, UpdateProjectInput);

  const existingProject = await await getDb().getProjectById(projectId);
  if (!existingProject) {
    throw new Error("Project not found");
  }

  const updatedProject = {
    ...existingProject,
    ...userInput,
    exclusions: userInput.exclusions.filter((s) => s.trim() !== "").join("\n"),
  };

  return await getDb().updateProject(updatedProject);
};
