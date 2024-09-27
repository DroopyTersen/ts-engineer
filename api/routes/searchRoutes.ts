import { searchCode } from "api/aiEngineer/api/searchCode";
import { Hono } from "hono";
import { SearchFilesCriteria } from "../aiEngineer/db/files.db";
const app = new Hono();

app.get("/", async (c) => {
  let query = c.req.query("query");
  console.log("🚀 | app.get | query:", query);
  if (!query) {
    return c.json({ error: "missing query" }, { status: 400 });
  }
  let criteria: SearchFilesCriteria = {
    query,
  };
  if (c.req.query("projectId")) {
    criteria.projectId = c.req.query("projectId");
  }
  if (c.req.query("filepath")) {
    criteria.filepath = c.req.query("filepath");
  }
  if (c.req.query("extension")) {
    criteria.extension = c.req.query("extension");
  }
  let results = await searchCode(criteria);

  return c.json(results);
});

export default app;
