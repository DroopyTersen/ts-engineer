import { CoreMessage } from "ai";
import { db } from "api/aiEngineer/db/db.server";
import { generateProjectChatResponse } from "api/aiEngineer/llm/generateProjectChatResponse";
import { getLLMByClassification } from "api/aiEngineer/llm/getLLMByClassification";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getProjectCodeContext } from "../codeTask/getProjectCodeContext";

export const chatWithProjectCode = async ({
  projectId,
  conversationId,
  messages,
  model,
  selectedFiles,
  emitter,
  signal,
}: {
  projectId: string;
  conversationId: string;
  messages: CoreMessage[];
  model: string;
  selectedFiles: string[];
  emitter: LLMEventEmitter;
  signal: AbortSignal;
}) => {
  try {
    console.log("🚀 | messages:", messages);
    let project = await db.getProjectById(projectId);
    let llm = getLLMByClassification(project.classification);
    console.log("🚀 | llm:", llm._model.modelId);
    let projectContext = await getProjectCodeContext({
      input: JSON.stringify(messages.slice(-3), null, 2),
      projectId,
      selectedFiles,
      maxTokens: llm._model.modelId === "deepseek-chat" ? 54_000 : 100_000,
    });
    emitter.emit("data", {
      type: "selectedFiles",
      selectedFiles: projectContext.filepaths,
    });

    let aiResponse = await generateProjectChatResponse(
      messages,
      projectContext,
      {
        emitter,
        llm,
        signal,
      }
    );

    return aiResponse;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    emitter.emit("error", { message: "Failed to process message" });
    throw error;
  }
};

export const generateConversationTitle = async (messages: CoreMessage[]) => {
  let llm = getLLM("openai", "gpt-4o-mini");
  let transcript = messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");
  let response = await llm.generateText({
    messages: [
      {
        role: "system",
        content:
          "Generate a short 2 to 6 word title for the provided conversation transcript",
      },
      {
        role: "user",
        content: `Here is the transcript:\n<transcript>\n${transcript}\n</transcript> Please respond with the title only.`,
      },
    ],
  });
  // Remove quotes if present at the beginning and end of the response
  let title = response.text;
  if (title.startsWith('"') && title.endsWith('"')) {
    title = title.slice(1, -1);
  }
  return title;
};
