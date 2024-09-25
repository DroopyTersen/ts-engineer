import { CodeProjectDbItem } from "@shared/db.schema";
import { z } from "zod";
import { getDb } from "./pglite/pglite.server";

const getProjects = async () => {
  try {
    const { rows } = await getDb().query("SELECT * FROM code_projects");
    const validatedProjects = z.array(CodeProjectDbItem).parse(rows);
    return validatedProjects;
  } catch (error) {
    console.error("Validation error:", error);
    throw new Error("Failed to validate projects from database");
  }
};

const getProjectByAbsolutePath = async (absolutePath: string) => {
  const { rows } = await getDb().query(
    "SELECT * FROM code_projects WHERE absolute_path = $1",
    [absolutePath]
  );
  if (rows.length === 0) {
    return null;
  }
  let parseResults = CodeProjectDbItem.safeParse(rows[0]);
  return parseResults.success ? parseResults.data : null;
};

const getProjectById = async (id: string) => {
  id = id.toUpperCase();
  const { rows } = await getDb().query(
    "SELECT * FROM code_projects WHERE id = $1",
    [id]
  );
  return CodeProjectDbItem.parse(rows[0]);
};

const updateProject = async (input: CodeProjectDbItem) => {
  try {
    const validatedInput = CodeProjectDbItem.parse(input);
    const { rows } = await getDb().query(
      `
      UPDATE code_projects
      SET name = $1, absolute_path = $2, summary = $3, exclusions = $4, test_code_command = $5
      WHERE id = $6
      RETURNING *
    `,
      [
        validatedInput.name,
        validatedInput.absolute_path,
        validatedInput.summary,
        validatedInput.exclusions,
        validatedInput.test_code_command,
        validatedInput.id,
      ]
    );
    return CodeProjectDbItem.parse(rows[0]);
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project in database");
  }
};

const insertProject = async (input: CodeProjectDbItem) => {
  try {
    const validatedInput = CodeProjectDbItem.parse(input);

    const { rows } = await getDb().query(
      `
      INSERT INTO code_projects (id, name, absolute_path, summary, exclusions, test_code_command)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        validatedInput.id,
        validatedInput.name,
        validatedInput.absolute_path,
        validatedInput.summary,
        validatedInput.exclusions,
        validatedInput.test_code_command,
      ]
    );

    console.log(`Project inserted successfully: ${validatedInput.name}`);
    return getProjectById(validatedInput.id);
  } catch (error) {
    console.error("Error inserting project:", error);
    throw new Error("Failed to insert project into database");
  }
};

export const projectsDb = {
  getProjects,
  getProjectById,
  getProjectByAbsolutePath,
  insertProject,
  updateProject,
};
