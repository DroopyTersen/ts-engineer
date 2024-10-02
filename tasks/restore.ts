import fs from "fs";
import path from "path";
import { getDb, initDb } from "../api/aiEngineer/db/pglite/pglite.server";

const restoreData = async () => {
  await initDb(".pglite");
  const db = await getDb();
  const backupPath = path.join(process.cwd(), ".backups", "backup.json");

  if (!fs.existsSync(backupPath)) {
    console.error("Backup file not found. Please run the backup task first.");
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"));

  // Confirm before proceeding
  console.log(
    "This will overwrite existing data in the database. Are you sure you want to proceed? (y/n)"
  );

  await db.query("DELETE FROM code_tasks");
  await db.query("DELETE FROM code_projects");

  // Restore projects
  for (const project of backup.projects) {
    await db.query(
      "INSERT INTO code_projects (id, name, absolute_path, summary, exclusions, test_code_command) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        project.id,
        project.name,
        project.absolute_path,
        project.summary,
        project.exclusions,
        project.test_code_command,
      ]
    );
  }

  // Restore tasks
  for (const task of backup.tasks) {
    await db.query(
      "INSERT INTO code_tasks (id, project_id, title, input, specifications, selected_files, plan, file_changes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [
        task.id,
        task.project_id,
        task.title,
        task.input,
        task.specifications,
        task.selected_files,
        task.plan,
        task.file_changes,
        task.created_at,
        task.updated_at,
      ]
    );
  }

  console.log("Restore completed successfully!");
};

restoreData().catch(console.error);
