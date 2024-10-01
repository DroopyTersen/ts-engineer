import { deleteConversation } from "api/aiEngineer/api/chat/deleteConversation";
import { getConversations } from "api/aiEngineer/api/chat/getConversations";
import { sendMessage } from "api/aiEngineer/api/chat/sendMessage";
import { db } from "api/aiEngineer/db/db.server";
import { Hono } from "hono";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";

const app = new Hono();

app.post("/:projectId/chat/:conversationId", async (c) => {
  const projectId = c.req.param("projectId");
  const conversationId = c.req.param("conversationId");
  const { messages, model, selectedFiles } = await c.req.json();

  const dataStream = createEventStreamDataStream(c.req.raw.signal);
  const emitter = dataStream.createEventEmitter();

  sendMessage({
    projectId,
    conversationId,
    messages,
    model,
    selectedFiles,
    emitter,
  }).finally(() => dataStream.close());

  return dataStream.toResponse();
});

app.get("/:projectId/conversations", async (c) => {
  const projectId = c.req.param("projectId");
  console.log("🚀 | app.get | projectId:", projectId);
  const conversations = await getConversations(projectId);
  return c.json(conversations);
});

app.get("/:projectId/conversations/:conversationId", async (c) => {
  const projectId = c.req.param("projectId");
  const conversationId = c.req.param("conversationId");
  let conversation = await db.getConversation(conversationId);
  return c.json(conversation);
});

app.delete("/:projectId/conversations/:conversationId", async (c) => {
  const projectId = c.req.param("projectId");
  const conversationId = c.req.param("conversationId");
  await deleteConversation(projectId, conversationId);
  return c.json({ success: true });
});

export default app;
