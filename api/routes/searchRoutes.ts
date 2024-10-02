import { getProjects } from "api/aiEngineer/api/getProjects.api";
import { searchCode } from "api/aiEngineer/api/searchCode";
import { Hono } from "hono";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { answerQuestion } from "../aiEngineer/api/answerQuestion";
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
  let projects = await getProjects();
  let results = await searchCode(criteria);

  return c.json({
    ...results,
    projects,
  });
});

app.post("/answer-question", async (c) => {
  const dataStream = createEventStreamDataStream(c.req.raw.signal);
  const emitter = dataStream.createEventEmitter();
  const { query, fileIds } = await c.req.json();

  answerQuestion({ query, fileIds }, { emitter }).finally(() =>
    dataStream.close()
  );

  return dataStream.toResponse();
});

export default app;
