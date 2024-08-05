import { OpenAI } from "openai";
import { OpenAIError } from "openai/error.mjs";
import { tryParseJson } from "~/toolkit/utils/tryParseJson";
import { LLMEventEmitter } from "../streams/LLMEventEmitter";
import { azureOpenAIConfig } from "./azureOpenAI.config";
import { OpenAITypes } from "./openai.types";

const DEFAULT_MODEL = "gpt-4o";

export const LLM_DEFAULTS = {
  model: DEFAULT_MODEL,
  temperature: 0.1,
  max_tokens: 2000,
  stream: true,
} satisfies Partial<OpenAITypes.ChatParams>;

export const createOpenAIClient = (mode: "azure" | "openai" = "azure") => {
  if (mode === "azure") {
    const client = new OpenAI({
      ...azureOpenAIConfig,
      maxRetries: 2,
    });
    return client;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    maxRetries: 2,
  });
};

export async function runToolsWithOpenAI(
  openai: OpenAI,
  input: Omit<OpenAITypes.RunToolsInput, "tools" | "model" | "stream"> & {
    tools?: OpenAITypes.RunnableToolWithDefinitionId[];
    model?: string;
  },
  {
    emitter,
    signal,
  }: {
    emitter?: LLMEventEmitter;
    signal?: AbortSignal;
  } = {}
) {
  let params: OpenAITypes.RunToolsInput = {
    ...LLM_DEFAULTS,
    ...input,
    tools: [],
    stream: true,
    max_tokens: 2000,
  };

  if (params.tools?.length < 1) {
    // @ts-expect-error
    delete params.tools;
  }

  let runner =
    params.tools?.length > 0
      ? openai.beta.chat.completions.runTools(params)
      : openai.beta.chat.completions.stream(params as any);
  let abortRunner = () => {
    runner.controller.abort();
  };
  signal?.addEventListener("abort", abortRunner);

  // Track tool use so we can match the
  // toolCallId in the Tool Result to the correct tool name.
  const toolCallIds = new Map<
    string,
    {
      name: string;
      timestamp: number;
      result?: any;
    }
  >();

  // LLM Start might get triggered multiple times if there
  // is tool use, so we need to track the build up of messages.
  let accumulatedMessages = [...params.messages];
  emitter?.emit("llm_start", {
    ...params,
    // AP: When I first passed by reference (without the spread),
    // I was seeing issues with every trace having the final, full
    // list of messages. I think this because langfuse is async, and
    // by the time the trace actually fired, the messages array had already
    // been updated with the new message.
    messages: [...accumulatedMessages],
  });

  runner.on("message", (message): void => {
    accumulatedMessages.push(message);

    // If role is assistant we know the LLM is done responding
    if (message.role === "assistant") {
      emitter?.emit("llm_end", message);
    }

    // The AI asked to for a tool call(s)
    if (message.role === "assistant" && message.tool_calls?.length) {
      message.tool_calls.forEach((toolCall) => {
        // Save the toolname with the toolCallId so we can look
        // it up with the tool result comes in.
        toolCallIds.set(toolCall.id, {
          name: toolCall.function.name,
          timestamp: Date.now(),
        });

        emitter?.emit("tool_call", {
          id: toolCall.id,
          name: toolCall.function.name,
          args: tryParseJson(toolCall.function.arguments) || {},
          timestamp: Date.now(),
        });
      });
    }
    // We've finished invoking a tool, and will now pass the
    /// result back to the LLM
    if (message.role === "tool") {
      // Map the tool result to the corresponding tool call so that we
      // can line it up to a specific tool name instead of just a toolCallId
      let result = tryParseJson(message.content) || message.content;
      // Look up the tool name from the toolCallId
      let toolUse = toolCallIds.get(message.tool_call_id);
      if (toolUse) {
        toolUse.result = result;
      }
      // We'll be calling the LLM again with the tool result,
      // so we'll emit another LLM start event.
      emitter?.emit("llm_start", {
        ...params,
        messages: [...accumulatedMessages],
      });

      emitter?.emit?.("tool_result", {
        toolCallId: message.tool_call_id,
        result: result,
        toolName: toolUse?.name || "",
        toolDefinitionId:
          input?.tools?.find((t) => t.function.name === toolUse?.name)
            ?.toolDefinitionId || "",
      });
    }
  });

  // The normal streaming text response
  runner.on("content", (delta) => {
    emitter?.emit("content", delta);
  });
  return runner
    .finalContent()
    .then((content) => {
      emitter?.emit("llm_end", content);
      return content;
    })
    .catch((err: OpenAIError) => {
      if (signal?.aborted) {
        return "";
      }
      emitter?.emit("error", err as any);
      throw err;
    })
    .finally(() => {
      signal?.removeEventListener("abort", abortRunner);
    });
}
