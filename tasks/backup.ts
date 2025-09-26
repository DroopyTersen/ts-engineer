import fs from "fs";
import path from "path";
import { getDb, initDb } from "../api/aiEngineer/db/pglite/pglite.server";

const backupData = async () => {
  await initDb(".pglite");

  const db = await getDb();
  const projects = await db.query("SELECT * FROM code_projects");
  const tasks = await db.query("SELECT * FROM code_tasks");

  // Normalize jsonb columns to JSON strings so future restores can reliably cast text -> jsonb
  const normalizedTasks = tasks.rows.map((task: any) => {
    const normalizedSelectedFiles =
      task && typeof task.selected_files === "object"
        ? JSON.stringify(task.selected_files)
        : task?.selected_files ?? null;
    const normalizedFileChanges =
      task && typeof task.file_changes === "object"
        ? JSON.stringify(task.file_changes)
        : task?.file_changes ?? null;

    return {
      ...task,
      selected_files: normalizedSelectedFiles,
      file_changes: normalizedFileChanges,
    };
  });

  const backup = {
    projects: projects.rows,
    tasks: normalizedTasks,
  };

  const backupDir = path.join(process.cwd(), ".backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const backupPath = path.join(backupDir, "backup.json");
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup completed successfully! File saved at: ${backupPath}`);
};

backupData().catch(console.error);
