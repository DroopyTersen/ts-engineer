import { Database } from "bun:sqlite";
import { z } from "zod";
import { CodeProjectDbItem } from "./db.schema";

export function ensureSchema(db: Database) {
  // Create the table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS code_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      absolute_path TEXT NOT NULL,
      summary TEXT NOT NULL
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

export const db = {
  _db,
  getProjects,
};
