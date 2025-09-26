import fs from "fs";
import path from "path";

const fixBackupJson = async () => {
  const backupsDir = path.join(process.cwd(), ".backups");
  const backupPath = path.join(backupsDir, "backup.json");

  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at: ${backupPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, "utf-8");
  let backup: any;
  try {
    backup = JSON.parse(raw);
  } catch (err) {
    console.error("backup.json is not valid JSON. Aborting.");
    throw err;
  }

  if (!backup || typeof backup !== "object") {
    console.error(
      "backup.json root must be an object containing projects and tasks arrays."
    );
    process.exit(1);
  }

  const tasks = Array.isArray(backup.tasks) ? backup.tasks : [];
  let modifiedCount = 0;

  for (const task of tasks) {
    // selected_files column is jsonb in DB. Passing a JS array to the driver
    // can serialize to Postgres array syntax ({"a","b"}), which is not valid JSON.
    // Convert arrays/objects to JSON strings so the DB can cast text->jsonb reliably.
    if (Array.isArray(task.selected_files)) {
      task.selected_files = JSON.stringify(task.selected_files);
      modifiedCount++;
    }

    // file_changes is jsonb as well; if it's an object/array, stringify it.
    if (task.file_changes && typeof task.file_changes === "object") {
      task.file_changes = JSON.stringify(task.file_changes);
      modifiedCount++;
    }
  }

  if (modifiedCount === 0) {
    console.log(
      "No changes needed. backup.json already uses JSON strings for jsonb fields."
    );
    return;
  }

  // Backup original file before overwriting
  const backupCopyPath = path.join(backupsDir, `backup.json.bak`);
  fs.writeFileSync(backupCopyPath, raw);

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(
    `Fixed ${modifiedCount} field(s). Wrote updated file to: ${backupPath}`
  );
  console.log(`Original file saved as: ${backupCopyPath}`);
};

fixBackupJson().catch((err) => {
  console.error(err);
  process.exit(1);
});
