import Anthropic from "@anthropic-ai/sdk";
import { LLMEventEmitter } from "../streams/LLMEventEmitter";
import { OpenAITypes } from "./openai.types";

export const createAnthropicClient = () =>
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

export const streamCompletion = async (
  anthropic: Anthropic,
  params: Omit<
    Anthropic.Messages.MessageStreamParams,
    "system" | "messages"
  > & {
    messages: OpenAITypes.ChatMessage[];
  },
  asyncOptions?: {
    signal?: AbortSignal;
    emitter?: LLMEventEmitter;
  }
): Promise<{ text: string; tokens: number }> => {
  let { signal, emitter } = asyncOptions || {};
  let [systemMessage, ...restOfMessages] = params.messages;
  // Ensure the first message is of role 'user'
  while (restOfMessages.length > 0 && restOfMessages[0].role !== "user") {
    restOfMessages.shift();
  }

  let finalParams: Anthropic.Messages.MessageStreamParams = {
    ...params,
    system: systemMessage.content + "",
    messages: restOfMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content + "",
    })),
  };
  let stream = anthropic.messages.stream(finalParams);
  let abortRunner = () => {
    stream.controller.abort();
  };
  signal?.addEventListener("abort", abortRunner);
  emitter?.emit("llm_start", finalParams);
  stream.on("error", (error: any) => {
    console.error("🚀 | streamCompletion | error:", error);
    if (emitter) {
      emitter.emit("error", error);
    }
  });

  stream.on("text", (delta) => {
    if (emitter) {
      emitter.emit("content", delta);
    }
  });

  return stream
    .finalMessage()
    .then((result) => {
      let text = result.content
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("");
      let tokens = result.usage.input_tokens + result.usage.output_tokens;
      emitter?.emit("llm_end", text);
      return { text, tokens };
    })
    .catch((err: any) => {
      if (signal?.aborted) {
        return { text: "", tokens: 0 };
      }
      emitter?.emit("error", err as any);
      throw err;
    })
    .finally(() => {
      signal?.removeEventListener("abort", abortRunner);
    });
};
