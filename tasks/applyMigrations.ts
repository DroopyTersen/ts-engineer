import {
  applyMigrations,
  getDb,
  initDb,
} from "../api/aiEngineer/db/pglite/pglite.server";

const main = async () => {
  await initDb(".pglite");
  const db = await getDb();
  await applyMigrations(db);
};

main().catch(console.error);
