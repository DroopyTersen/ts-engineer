import {
  chatWithProjectCode,
  generateConversationTitle,
} from "api/aiEngineer/api/chat/chatWithProjectCode";
import { deleteConversation } from "api/aiEngineer/api/chat/deleteConversation";
import { getConversations } from "api/aiEngineer/api/chat/getConversations";
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

  chatWithProjectCode({
    projectId,
    conversationId,
    messages,
    model,
    selectedFiles,
    emitter,
    signal: c.req.raw.signal,
  })
    .catch((err) => {
      console.error("Error in chatWithProjectCode", err);
      emitter.emit("error", { message: "Failed to process message" });
    })
    .finally(() => {
      console.log("Closing data stream");
      dataStream.close();
    });

  return dataStream.toResponse();
});

app.post("/:projectId/conversations/:conversationId", async (c) => {
  const projectId = c.req.param("projectId");
  const conversationId = c.req.param("conversationId");
  let { messages, selectedFiles } = await c.req.json();
  let lastMessage = messages.pop();
  lastMessage.selectedFiles = selectedFiles;
  messages = [...messages, lastMessage];
  let existingConversation = await db.getConversation(conversationId);
  let title =
    existingConversation?.title || (await generateConversationTitle(messages));
  await db.saveConversation({
    id: conversationId,
    project_id: projectId,
    messages,
    title: title,
  });
  return c.json({ success: true });
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
