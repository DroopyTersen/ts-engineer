import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { getFileContent } from "api/aiEngineer/fs/getFileContent";
import { readdirSync } from "fs";
import { join } from "path";
import { createSingleton } from "~/toolkit/utils/createSingleton.server";

let _pg: PGlite;
export const initDb = async (dataDir?: string) => {
  _pg = await createSingleton("pg", async () => {
    let pg = new PGlite({
      dataDir: dataDir,
      extensions: {
        vector,
      },
    });

    await applyMigrations(pg);
    return pg;
  });
  return _pg;
};

export const getDb = () => {
  if (!_pg) {
    throw new Error("Database not initialized");
  }
  return _pg;
};

const MIGRATIONS_DIR = "api/aiEngineer/db/pglite/migrations";
const applyMigrations = async (pg: PGlite) => {
  // Get all SQL files in the current directory
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort(); // Sorting to ensure migrations are applied in order

  // Apply each migration
  for (const file of migrationFiles) {
    const filePath = join(file);
    console.log("🚀 | applyMigrations | filePath:", filePath);
    const sqlScript = await getFileContent(filePath, MIGRATIONS_DIR);

    await pg.exec(sqlScript, {});
  }

  console.log("All migrations applied successfully!!!");
};
