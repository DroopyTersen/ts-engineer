import { CoreMessage } from "ai";
import { generateProjectChatResponse } from "api/aiEngineer/llm/generateProjectChatResponse";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { db } from "../../db/db.server";
import { getProjectCodeContext } from "../codeTask/getProjectCodeContext";

export const chatWithProjectCode = async ({
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
    console.log("🚀 | messages:", messages);
    let [projectContext, existingConversation] = await Promise.all([
      getProjectCodeContext(
        JSON.stringify(messages.slice(-3), null, 2),
        projectId,
        selectedFiles
      ),
      db.getConversation(conversationId),
    ]);
    // console.log(
    //   "🚀 | projectContext:",
    //   projectContext.fileContents.map((fc) => fc.slice(0, 100)).join("\n")
    // );
    let llm =
      projectContext.classification === "work"
        ? getLLM("azure", "gpt-4o")
        : getLLM("anthropic", "claude-3-5-sonnet-20241022");
    emitter.emit("data", {
      type: "selectedFiles",
      selectedFiles: projectContext.filepaths,
    });
    console.log("🚀 | messages:", messages);
    let aiResponse = await generateProjectChatResponse(
      messages,
      projectContext,
      {
        emitter,
        llm,
      }
    );

    // let newMessages = [
    //   ...messages,
    //   {
    //     role: "assistant",
    //     content: aiResponse,
    //     selectedFiles: projectContext.filepaths,
    //   },
    // ];
    // console.log("🚀 | START NEW MESSAGES:!!");
    // newMessages.forEach((m) => {
    //   console.log(`${m.role}: ${m.content.slice(0, 25)}...`);
    // });
    // console.log("🚀 | END NEW MESSAGES:!!");

    // let title =
    //   existingConversation?.title ||
    //   (await generateConversationTitle(newMessages as any[]));

    // let newConversation = await db.saveConversation({
    //   id: conversationId,
    //   project_id: projectId,
    //   messages: newMessages as any[],
    //   title: title,
    // });

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
