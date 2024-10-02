import fs from "fs";
import path from "path";
import { getDb, initDb } from "../api/aiEngineer/db/pglite/pglite.server";

const backupData = async () => {
  await initDb(".pglite");

  const db = await getDb();
  const projects = await db.query("SELECT * FROM code_projects");
  const tasks = await db.query("SELECT * FROM code_tasks");

  const backup = {
    projects: projects.rows,
    tasks: tasks.rows,
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
