import { CodeProjectDbItem } from "@shared/db.schema";
import { Database } from "bun:sqlite";
import { z } from "zod";

export function ensureSchema(db: Database) {
  // Create the table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS code_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      absolute_path TEXT NOT NULL,
      summary TEXT NOT NULL,
      files TEXT NOT NULL
    )
  `);
  console.log("Schema ensured for code_projects table");
}

const _db = new Database("db.sqlite", { create: true });
ensureSchema(_db);

const getProjects = () => {
  let rows = _db.query("SELECT * FROM code_projects").all();
  try {
    const validatedProjects = z.array(CodeProjectDbItem).parse(rows);
    return validatedProjects;
  } catch (error) {
    console.error("Validation error:", error);
    throw new Error("Failed to validate projects from database");
  }
};
const getProjectByAbsolutePath = (absolutePath: string) => {
  const row = _db
    .prepare("SELECT * FROM code_projects WHERE absolute_path = ?")
    .get(absolutePath);
  if (!row) {
    return null;
  }
  let parseResults = CodeProjectDbItem.safeParse(row);
  return parseResults.success ? parseResults.data : null;
};

const getProjectById = (id: string) => {
  id = id.toUpperCase();
  const row = _db.prepare("SELECT * FROM code_projects WHERE id = ?").get(id);
  return CodeProjectDbItem.parse(row);
};

const updateProject = (input: CodeProjectDbItem) => {
  try {
    const validatedInput = CodeProjectDbItem.parse(input);
    const stmt = _db.prepare(`
      UPDATE code_projects
      SET name = ?, absolute_path = ?, summary = ?, files = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      validatedInput.name,
      validatedInput.absolute_path,
      validatedInput.summary,
      JSON.stringify(validatedInput.files || [])
    );
    return getProjectById(validatedInput.id);
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project in database");
  }
};

const insertProject = (input: CodeProjectDbItem) => {
  try {
    const validatedInput = CodeProjectDbItem.parse(input);

    const stmt = _db.prepare(`
      INSERT INTO code_projects (id, name, absolute_path, summary, files)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      validatedInput.id,
      validatedInput.name,
      validatedInput.absolute_path,
      validatedInput.summary,
      JSON.stringify(validatedInput.files || [])
    );

    console.log(`Project inserted successfully: ${validatedInput.name}`);
    return getProjectById(validatedInput.id);
  } catch (error) {
    console.error("Error inserting project:", error);
    throw new Error("Failed to insert project into database");
  }
};

export const db = {
  _db,
  getProjects,
  getProjectById,
  getProjectByAbsolutePath,
  insertProject,
  updateProject,
};