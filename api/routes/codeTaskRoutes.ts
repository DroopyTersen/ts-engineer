import { Hono } from "hono";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { writeCodingPlan } from "../aiEngineer/api/codeTask/writeCodingPlan";
import { writeSpecifications } from "../aiEngineer/api/codeTask/writeSpecifications";
import { db } from "../aiEngineer/db/db.server";

const app = new Hono();

app.get("/:projectId/codeTasks", async (c) => {
  let codeTasks = await db.getRecentCodeTasks(c.req.param("projectId"));
  return c.json(codeTasks);
});

app.get("/:projectId/codeTasks/:codeTaskId", async (c) => {
  let codeTask = await db
    .getCodeTaskById(c.req.param("codeTaskId"))
    .catch((err) => null);
  return c.json(codeTask);
});

app.post("/:projectId/codeTasks/:codeTaskId/specifications", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  let projectId = c.req.param("projectId");
  let codeTaskId = c.req.param("codeTaskId");
  let args = await c.req.json();
  writeSpecifications(
    {
      projectId,
      codeTaskId,
      ...args,
    },
    {
      emitter,
    }
  ).finally(() => dataStream.close());
  return dataStream.toResponse();
});

app.post("/:projectId/codeTasks/:codeTaskId/codingPlan", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  let projectId = c.req.param("projectId");
  let codeTaskId = c.req.param("codeTaskId");
  let args = await c.req.json();
  writeCodingPlan(
    {
      projectId,
      codeTaskId,
      specifications: args.input,
    },
    {
      emitter,
    }
  ).finally(() => dataStream.close());

  return dataStream.toResponse();
});

app.delete("/:projectId/codeTasks/:codeTaskId", async (c) => {
  const projectId = c.req.param("projectId");
  const codeTaskId = c.req.param("codeTaskId");

  try {
    await db.deleteCodeTask(codeTaskId);
    return c.json({
      success: true,
      message: "Code task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting code task:", error);
    return c.json(
      { success: false, message: "Failed to delete code task" },
      500
    );
  }
});

export default app;