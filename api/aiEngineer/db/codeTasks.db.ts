import { z } from "zod";
import { getDb } from "./pglite/pglite.server";

// Define the CodeTaskDbItem schema
export const CodeTaskDbItem = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string().nullable(),
  input: z.string(),
  specifications: z.string().nullable(),
  selected_files: z.array(z.string()).nullable(),
  plan: z.string().nullable(),
  file_changes: z.record(z.unknown()).nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type CodeTaskDbItem = z.infer<typeof CodeTaskDbItem>;

// Create a new code task
const createNewCodeTask = async (
  input: Omit<z.infer<typeof CodeTaskDbItem>, "created_at" | "updated_at">
) => {
  try {
    const { rows } = await getDb().query(
      `
      INSERT INTO code_tasks (id, project_id, title, input, specifications, selected_files, plan, file_changes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        input.id,
        input.project_id,
        input.title,
        input.input,
        input.specifications,
        JSON.stringify(input.selected_files),
        input.plan,
        JSON.stringify(input.file_changes),
      ]
    );
    return CodeTaskDbItem.parse(rows[0]);
  } catch (error) {
    console.error("Error creating new code task:", error);
    throw new Error("Failed to create new code task in database");
  }
};

// Update specifications for an existing code task
const updateSpecifications = async (id: string, specifications: string) => {
  try {
    const { rows } = await getDb().query(
      `
      UPDATE code_tasks
      SET specifications = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [specifications, id]
    );
    return CodeTaskDbItem.parse(rows[0]);
  } catch (error) {
    console.error("Error updating code task specifications:", error);
    throw new Error("Failed to update code task specifications in database");
  }
};

// Get a code task by ID
const getCodeTaskById = async (id: string) => {
  try {
    const { rows } = await getDb().query(
      "SELECT * FROM code_tasks WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return CodeTaskDbItem.parse(rows[0]);
  } catch (error) {
    console.error("Error getting code task:", error);
    throw new Error("Failed to get code task from database");
  }
};

// Delete a code task
const deleteCodeTask = async (id: string) => {
  try {
    await getDb().query("DELETE FROM code_tasks WHERE id = $1", [id]);
  } catch (error) {
    console.error("Error deleting code task:", error);
    throw new Error("Failed to delete code task from database");
  }
};

export const getRecentCodeTasks = async (projectId: string) => {
  const { rows } = await getDb().query(
    "SELECT * FROM code_tasks WHERE project_id = $1 ORDER BY created_at DESC LIMIT 10",
    [projectId]
  );
  return rows.map((row) => CodeTaskDbItem.parse(row));
};

export async function updateCodingPlan({
  codeTaskId,
  codingPlan,
  specifications,
}: {
  codeTaskId: string;
  codingPlan: string;
  specifications?: string;
}) {
  try {
    let query: string;
    let params: any[];

    if (specifications) {
      query = `
        UPDATE code_tasks
        SET plan = $1, specifications = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      params = [codingPlan, specifications, codeTaskId];
    } else {
      query = `
        UPDATE code_tasks
        SET plan = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      params = [codingPlan, codeTaskId];
    }

    const { rows } = await getDb().query(query, params);
    return CodeTaskDbItem.parse(rows[0]);
  } catch (error) {
    console.error(
      "Error updating code task coding plan and specifications:",
      error
    );
    throw new Error(
      "Failed to update code task coding plan and specifications in database"
    );
  }
}

export const codeTasksDb = {
  createNewCodeTask,
  updateSpecifications,
  getCodeTaskById,
  getRecentCodeTasks,
  deleteCodeTask,
  updateCodingPlan,
};
