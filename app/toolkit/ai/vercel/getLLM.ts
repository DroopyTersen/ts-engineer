import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import {
  GenerateObjectResult,
  generateObject as vercelGenerateObject,
  generateText as vercelGenerateText,
  streamObject as vercelStreamObject,
  streamText as vercelStreamText,
} from "ai";
import { z } from "zod";
import { AsyncReturnType, Prettify } from "~/toolkit/utils/typescript.utils";
import { LLMEventEmitter } from "../streams/LLMEventEmitter";
import "./bunPolyfill";

export const MODEL_PROVIDERS = {
  deepseek: {
    create: createOpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY!,
    }),
    models: {
      "deepseek-chat": "deepseek-chat",
      "deepseek-coder": "deepseek-coder",
    },
  },
  openai: {
    create: createOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    }),
  },
  anthropic: {
    create: createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    }),
  },
};

export type ModelProvider = keyof typeof MODEL_PROVIDERS;

export type LLM = ReturnType<typeof getLLM>;

export const getLLM = <T extends ModelProvider>(
  provider: T,
  modelName: T extends "deepseek"
    ? keyof (typeof MODEL_PROVIDERS)["deepseek"]["models"]
    : Parameters<(typeof MODEL_PROVIDERS)[T]["create"]>[0]
) => {
  let _model = MODEL_PROVIDERS[provider].create(modelName as string, {
    cacheControl: true,
  });

  return {
    _model,
    generateText: async (
      params: GenerateTextParams,
      asyncOptions?: AsyncOptions
    ) => {
      return _generateText({ ...params, model: _model }, asyncOptions);
    },
    generateData: async <TSchema extends z.ZodTypeAny>(
      params: GenerateDataParams<TSchema>,
      asyncOptions?: AsyncOptions
    ) => {
      return _generateData({ ...params, model: _model }, asyncOptions);
    },
    streamText: async (
      params: StreamTextParams,
      asyncOptions?: AsyncOptions
    ) => {
      return _streamText({ ...params, model: _model }, asyncOptions);
    },
    runTools: async (
      params: StreamTextParams & { maxLoops?: number },
      asyncOptions?: AsyncOptions
    ) => {
      return _streamTextWithTools({ ...params, model: _model }, asyncOptions);
    },
    streamData: async <TSchema extends z.ZodType>(
      params: StreamDataParams<TSchema>,
      asyncOptions?: AsyncOptions
    ) => {
      return _streamData({ ...params, model: _model }, asyncOptions);
    },
  };
};

export type AsyncOptions = {
  signal?: AbortSignal;
  emitter?: LLMEventEmitter;
};
export type GenerateTextParams = Prettify<
  Omit<Parameters<typeof vercelGenerateText>[0], "model">
>;

export type GenerateDataParams<T extends z.ZodTypeAny> = Prettify<
  Omit<Parameters<typeof vercelGenerateObject>[0], "model" | "schema"> & {
    schema: T;
  }
>;

export type StreamTextParams = Prettify<
  Omit<Parameters<typeof vercelStreamText>[0], "model">
>;

export type StreamDataParams<T extends z.ZodType> = Prettify<
  Omit<Parameters<typeof vercelStreamObject>[0], "model"> & { schema: T }
>;

const _generateText = async (
  params: Parameters<typeof vercelGenerateText>[0],
  asyncOptions?: AsyncOptions
) => {
  const { signal, emitter } = asyncOptions || {};
  emitter?.emit("llm_start", params);

  let result = await vercelGenerateText({
    ...params,
    abortSignal: signal,
  });
  emitter?.emit("llm_end", result);

  return result;
};

export type VercelChatParams =
  | Parameters<typeof vercelGenerateObject>[0]
  | Parameters<typeof vercelStreamText>[0]
  | Parameters<typeof vercelStreamObject>[0]
  | Parameters<typeof vercelGenerateText>[0];

export type VercelChatResult = Prettify<
  Partial<
    Omit<StreamDataResult, "rawResponse"> &
      Omit<StreamTextResult, "rawResponse"> &
      Omit<AsyncReturnType<typeof _generateData>, "rawResponse"> &
      Omit<AsyncReturnType<typeof _generateText>, "rawResponse">
  >
>;

export type VercelUsage = GenerateObjectResult<any>["usage"];

export const _generateData = async <TSchema extends z.ZodTypeAny>(
  params: Omit<Parameters<typeof vercelGenerateObject>[0], "schema"> & {
    schema: TSchema;
  },
  asyncOptions?: AsyncOptions
) => {
  const { signal, emitter } = asyncOptions || {};
  emitter?.emit("llm_start", params);
  let { rawResponse, ...result } = await vercelGenerateObject({
    ...params,
    abortSignal: signal,
  });
  emitter?.emit("llm_end", result);

  return result as Omit<
    AsyncReturnType<typeof vercelGenerateObject>,
    "object"
  > & { object: z.infer<TSchema> };
};

type StreamTextResult = NonNullable<
  Parameters<typeof vercelStreamText>[0]["onFinish"]
> extends (event: infer E) => any
  ? E
  : never;

const _streamText = async (
  params: Parameters<typeof vercelStreamText>[0],
  asyncOptions?: AsyncOptions
): Promise<StreamTextResult> => {
  const { signal, emitter } = asyncOptions || {};

  return new Promise(async (resolve, reject) => {
    emitter?.emit("llm_start", params);
    try {
      const stream = await vercelStreamText({
        abortSignal: signal,
        ...params,
        onFinish: (result) => {
          if (result.toolCalls) {
            for (const toolCall of result.toolCalls) {
              emitter?.emit("tool_call", {
                id: toolCall.toolCallId,
                name: toolCall.toolName,
                args: toolCall.args,
                timestamp: Date.now(),
              });
            }
          }
          emitter?.emit("llm_end", result);
          resolve(result);
        },
      });

      for await (const chunk of stream.textStream) {
        emitter?.emit("content", chunk);
      }
    } catch (err: any) {
      console.error("🚀 | streamText err:", err);
      emitter?.emit("error", err);
      reject(err);
    }
  });
};

type StreamDataResult = NonNullable<
  Parameters<typeof vercelStreamObject>[0]["onFinish"]
> extends (event: infer E) => any
  ? E
  : never;

const _streamData = async <TSchema extends z.ZodType>(
  params: Parameters<typeof vercelStreamObject>[0] & { schema: TSchema },
  asyncOptions?: AsyncOptions
): Promise<StreamDataResult> => {
  const { signal, emitter } = asyncOptions || {};

  return new Promise(async (resolve, reject) => {
    emitter?.emit("llm_start", params);
    try {
      const stream = await vercelStreamObject<z.infer<TSchema>>({
        abortSignal: signal,
        ...params,
        onFinish: (result) => {
          if (result.object) {
            emitter?.emit("data", result.object);
          }
          emitter?.emit("llm_end", result);
          resolve(result);
        },
      });

      for await (const partialObject of stream.partialObjectStream) {
        // @ts-ignore
        emitter?.emit(
          "partial_data",
          // @ts-ignore
          partialObject
        );
      }
    } catch (err: any) {
      console.error("🚀 | streamData err:", err);
      emitter?.emit("error", err);
      reject(err);
    }
  });
};

const _streamTextWithTools = async (
  params: Parameters<typeof vercelStreamText>[0] & { maxLoops?: number },
  asyncOptions?: AsyncOptions
): Promise<StreamTextResult> => {
  const { signal, emitter } = asyncOptions || {};
  let messages = [...(params.messages || [])];
  let loopCount = 0;
  const maxLoops = params.maxLoops || 5;

  // const executeTools = async (toolCalls: any[]) => {
  //   for (const toolCall of toolCalls) {
  //     const tool = params.tools?.[toolCall.toolName];
  //     if (tool && tool.execute) {
  //       emitter?.emit("tool_call", {
  //         id: toolCall.toolCallId,
  //         name: toolCall.toolName,
  //         args: toolCall.args,
  //         timestamp: Date.now(),
  //       });

  //       try {
  //         const result = await tool.execute(toolCall.args);
  //         emitter?.emit("tool_result", {
  //           toolCallId: toolCall.toolCallId,
  //           toolName: toolCall.toolName,
  //           result,
  //           toolDefinitionId: "",
  //         });

  //         messages.push({
  //           role: "tool",
  //           content: [
  //             {
  //               type: "tool-result",
  //               toolCallId: toolCall.toolCallId,
  //               toolName: toolCall.toolName,
  //               result,
  //             },
  //           ],
  //         });
  //       } catch (error: any) {
  //         console.error(`Error executing tool ${toolCall.toolName}:`, error);
  //         emitter?.emit("error", error);
  //       }
  //     }
  //   }
  // };

  return new Promise(async (resolve, reject) => {
    emitter?.emit("llm_start", params);
    try {
      let finalContent = "";
      const stream = await vercelStreamText({
        ...params,
        messages,
        abortSignal: signal,
        onFinish: async (result) => {
          if (
            result.toolCalls &&
            result.toolCalls.length > 0 &&
            loopCount < maxLoops
          ) {
            messages.push({
              role: "assistant",
              content: result.toolCalls.map((toolCall) => ({
                type: "tool-call",
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args,
              })),
            });
            if (result.toolResults) {
              result.toolResults.forEach((r: any) => {
                emitter?.emit("tool_result", {
                  toolCallId: r.toolCallId,
                  toolName: r.toolName,
                  result: r.result,
                  toolDefinitionId: r.toolName,
                });
              });
              messages.push({
                role: "tool",
                content: result.toolResults as unknown as any[],
              });
            }
            loopCount++;
            // resolve(result);
            // await executeTools(result.toolCalls);

            // Recursive call with updated messages
            const nextResult = await _streamTextWithTools(
              { ...params, messages, maxLoops: maxLoops - 1 },
              asyncOptions
            );
            resolve({
              ...nextResult,
              toolCalls: [
                ...(result.toolCalls || []),
                ...(nextResult.toolCalls || []),
              ],
              toolResults: [
                ...(result.toolResults || []),
                ...(nextResult.toolResults || []),
              ],
            });
          } else {
            emitter?.emit("llm_end", result);
            emitter?.emit("final_content", finalContent);
            resolve(result);
          }
        },
      });

      for await (const chunk of stream.fullStream) {
        if (chunk.type === "text-delta") {
          finalContent += chunk.textDelta;
          emitter?.emit("content", chunk.textDelta);
        } else if (chunk.type === "tool-call") {
          emitter?.emit("tool_call", {
            id: chunk.toolCallId,
            name: chunk.toolName,
            args: chunk.args,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err: any) {
      console.error("🚀 | streamTextWithTools err:", err);
      emitter?.emit("error", err);
      reject(err);
    }
  });
};

export type LLMMessageTextContent = {
  type: "text";
  text: string;
};

export const getCachedMessageContent = (content: string) => {
  return {
    type: "text" as const,
    text: content,
    experimental_providerMetadata: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  } as {
    type: "text";
    text: string;
  };
};
