import { CoreMessage } from "ai";
import { chatWithProject } from "api/aiEngineer/llm/chatWithProject";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { db } from "../../db/db.server";
import { getProjectCodeContext } from "../codeTask/getProjectCodeContext";

export const sendMessage = async ({
  projectId,
  conversationId,
  messages,
  model,
  selectedFiles,
  emitter,
}: {
  projectId: string;
  conversationId: string;
  messages: CoreMessage[];
  model: string;
  selectedFiles: string[];
  emitter: LLMEventEmitter;
}) => {
  try {
    let [projectContext, existingConversation] = await Promise.all([
      getProjectCodeContext(
        JSON.stringify(messages.slice(-3), null, 2),
        projectId,
        selectedFiles
      ),
      db.getConversation(conversationId),
    ]);
    const llm = getLLM("anthropic", "claude-3-5-sonnet");
    let aiResponse = await chatWithProject(messages, projectContext, {
      llm,
      emitter,
    });
    let newMessages = [...messages, { role: "assistant", content: aiResponse }];
    let title =
      existingConversation?.title ||
      (await generateTitle(newMessages as any[]));
    let newConversation = await db.saveConversation({
      id: conversationId,
      project_id: projectId,
      messages: [
        ...(messages as any[]),
        {
          role: "assistant",
          content: aiResponse,
          selectedFiles: selectedFiles,
        },
      ],
      title: title,
    });

    return aiResponse;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    emitter.emit("error", { message: "Failed to process message" });
    throw error;
  }
};

const generateTitle = async (messages: CoreMessage[]) => {
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
  return response.text;
};
