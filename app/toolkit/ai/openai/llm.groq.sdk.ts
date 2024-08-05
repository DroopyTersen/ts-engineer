import Groq from "groq-sdk";
import { z } from "zod";
import { LLMEventEmitter } from "../streams/LLMEventEmitter";
import { OpenAITypes } from "./openai.types";

let client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
  maxRetries: 3,
});
const MODEL = "llama3-70b-8192";
type ChatCompletionCreateParamsNonStreaming = Parameters<
  typeof client.chat.completions.create
>[0] & {
  stream: false;
};

type ChatCompletionInput = {
  messages: ChatCompletionCreateParamsNonStreaming["messages"];
} & Partial<ChatCompletionCreateParamsNonStreaming>;
export const chatCompletion = async (
  params: ChatCompletionInput
): Promise<string> => {
  let result = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    ...params,
  });

  return result?.choices?.[0]?.message?.content || "Chat Completion Failed";
};
type ChatCompletionCreateParamsStreaming = Parameters<
  typeof client.chat.completions.create
>[0] & {
  stream: true;
};

type GroqTool = Groq.Chat.Completions.CompletionCreateParams.Tool;
export const streamCompletion = async (
  messages: Array<{ role: string; content: string }>,
  onToken?: (token: string) => void,
  options?: ChatCompletionCreateParamsStreaming
): Promise<string> => {
  let fullText = "";
  return new Promise(async (resolve, reject) => {
    const events = await client.chat.completions.create({
      messages: messages,
      stream: true,
      model: MODEL,
      temperature: 0.1,
      ...options,
    });
    for await (const event of events) {
      for (const choice of event.choices) {
        const delta = choice.delta?.content;
        if (delta) {
          onToken?.(delta);
          fullText += delta;
        }
      }
    }
    resolve(fullText);
  });
};

export async function extractSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  llmParams: Partial<ChatCompletionCreateParamsNonStreaming>
) {
  type TArgs = z.infer<TSchema>;
  let response = await chatCompletion({
    ...llmParams,
    temperature: 0.1,
    max_tokens: 400,
    model: MODEL,
    response_format: {
      type: "json_object",
    },
  } as any);
  try {
    let result = schema.parse(JSON.parse(response));
    return result as TArgs;
  } catch (err: any) {
    throw new Error("Unable to extract schema: " + err.message);
  }
}

export async function runTools(
  input: Omit<OpenAITypes.RunToolsInput, "model" | "stream">,
  emitter?: LLMEventEmitter
) {
  let messages = [
    ...input.messages,
  ] as ChatCompletionCreateParamsNonStreaming["messages"];
  let groqTools = input.tools.map((t) => {
    return {
      type: "function",
      function: {
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters as any,
      },
    } satisfies GroqTool;
  });
  let responseMessage: Groq.Chat.Completions.ChatCompletion.Choice.Message;

  // Loop until there are no more tool calls to process
  while (true) {
    let params = {
      model: MODEL,
      temperature: input?.temperature || 0.1,
      max_tokens: input?.max_tokens || 400,
      messages: messages,
      tools: groqTools,
    };
    emitter?.emit("llm_start", params);
    let response = await client.chat.completions.create(params);
    emitter?.emit("llm_end", params);

    responseMessage = response.choices[0].message;
    emitter?.emit("message", responseMessage as any);
    const toolCalls = responseMessage.tool_calls;

    // Break the loop if there are no tool calls
    if (!toolCalls || toolCalls.length === 0) {
      break;
    }

    // Process each tool call
    for (const toolCall of toolCalls) {
      if (toolCall?.function?.name) {
        const functionName = toolCall?.function?.name;
        let functionCallResult = { error: "Function not found" };
        let tool = input.tools.find((t) => t.function.name === functionName);
        if (tool) {
          const argsString = toolCall?.function?.arguments;
          let args: any = argsString;
          if (argsString && tool && "parse" in tool.function) {
            args = tool.function.parse(argsString);
          }
          try {
            emitter?.emit("tool_call", {
              id: toolCall.id || "",
              name: functionName || "",
              args: args,
              timestamp: Date.now(),
            });
            functionCallResult = await (tool.function.function as any)(args);
            emitter?.emit("tool_result", {
              toolCallId: toolCall.id || "",
              toolName: functionName || "",
              result: functionCallResult,
              toolDefinitionId: "",
            });
          } catch (error: any) {
            functionCallResult = {
              error: error?.message || "Unable to invoke tool: " + functionName,
            };
          }
        }
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(functionCallResult),
        });
      }
    }
  }
  emitter?.emit("final_content", responseMessage?.content || "");
  // Return the final content after processing all tool calls
  return responseMessage?.content || "";
}
