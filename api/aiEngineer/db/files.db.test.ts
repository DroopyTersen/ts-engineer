import { initDb } from "api/aiEngineer/db/pglite/pglite.server";
import { beforeAll, describe, expect, it } from "bun:test";
import { db } from "./db.server";

describe.only("file search", () => {
  let PROJECT_PATH = "/Users/drew/code/prompt-writer";
  let PROJECT_ID = "";
  beforeAll(async () => {
    // Initialize in-memory database
    await initDb(".pglite-test");
    // let newProject = await createNewProject({
    //   absolutePath: PROJECT_PATH,
    // });
    // PROJECT_ID = newProject.id;
    // await indexProject(newProject.id);
  });

  it("should support case insensitive keyword search", async () => {
    let results = await db.searchFilesByKeyword({
      query: `usePersistedState`,
    });
    // console.log("🚀 | it | results:", results);
    expect(results.length).toBeGreaterThan(0);

    results = await db.searchFilesByKeyword({
      query: `usepersistedstate`,
    });

    expect(results.length).toBeGreaterThan(0);

    results = await db.searchFilesByKeyword({
      query: `@remix-run`,
    });
    expect(results.length).toBeGreaterThan(0);
    console.log(
      "🚀 | FILE MATCHES:\n",
      results.map((r) => r.filename + "\n" + r.snippet).join("\n\n\n")
    );
  });
});
