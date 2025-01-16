import {
  CoreMessage,
  generateId,
  generateObject as vercelGenerateObject,
  GenerateObjectResult as VercelGenerateObjectResult,
  generateText as vercelGenerateText,
  GenerateTextResult as VercelGenerateTextResult,
  streamObject as vercelStreamObject,
  streamText as vercelStreamText,
} from "ai";
import { z } from "zod";
import { AsyncReturnType, Prettify } from "~/toolkit/utils/typescript.utils";
import { LLMEventEmitter } from "../streams/LLMEventEmitter";
import { MODEL_PROVIDERS, ModelProvider } from "./modelProviders";

export type LLM = ReturnType<typeof getLLM>;

export const getLLM = <T extends ModelProvider>(
  provider: T,
  modelName: keyof (typeof MODEL_PROVIDERS)[T]["models"]
) => {
  let structuredOutputs = false;
  if (modelName.toString().endsWith("-structured")) {
    structuredOutputs = false;
    modelName = modelName
      .toString()
      .replace(
        "-structured",
        ""
      ) as keyof (typeof MODEL_PROVIDERS)[T]["models"];
  }
  let _model = MODEL_PROVIDERS[provider].create(modelName as string, {
    structuredOutputs,
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
      return _generateData(
        { ...params, model: _model, maxRetries: 3 },
        asyncOptions
      );
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
    streamData: async <TSchema extends z.ZodTypeAny>(
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
  Omit<Parameters<typeof vercelGenerateText>[0], "model"> & {
    label?: string;
  }
>;

export type GenerateDataParams<T extends z.ZodTypeAny> = Prettify<
  Omit<
    Parameters<typeof vercelGenerateObject>[0],
    "model" | "schema" | "output"
  > & {
    schema: T;
    label?: string;
    schemaName?: string;
    schemaDescription?: string;
  }
>;

export type StreamTextParams = Prettify<
  Omit<Parameters<typeof vercelStreamText>[0], "model"> & {
    label?: string;
    startSequence?: string;
  }
>;

export type StreamDataParams<T extends z.ZodTypeAny> = Prettify<
  Omit<
    Parameters<typeof vercelStreamObject>[0],
    "model" | "schema" | "output"
  > & {
    schema: T;
    label?: string;
  }
>;

const _generateText = async (
  params: Parameters<typeof vercelGenerateText>[0] & { label?: string },
  asyncOptions?: AsyncOptions
) => {
  const { signal, emitter } = asyncOptions || {};
  let requestId = generateId();
  emitter?.emit("llm_start", { requestId, ...params });

  let result = await vercelGenerateText({
    ...params,
    abortSignal: signal,
  });
  emitter?.emit("llm_end", {
    requestId,
    ...result,
  });

  return result;
};

export type VercelChatParams =
  | Parameters<typeof vercelGenerateObject>[0]
  | Parameters<typeof vercelStreamText>[0]
  | Parameters<typeof vercelStreamObject>[0]
  | Parameters<typeof vercelGenerateText>[0];

export type VercelChatResult = Prettify<
  Partial<
    VercelGenerateObjectResult<any> | VercelGenerateTextResult<any, any>
    // | VercelStreamObjectResult<any, any, any>
    // | VercelStreamTextResult<any>
  >
>;

export type VercelUsage = VercelGenerateObjectResult<any>["usage"];
export type VercelChatMessages = NonNullable<
  Parameters<typeof vercelGenerateObject>[0]["messages"]
>;
export type VercelChatMessage = VercelChatMessages[number];

export const _generateData = async <TSchema extends z.ZodTypeAny>(
  params: Omit<
    Parameters<typeof vercelGenerateObject>[0],
    "schema" | "output"
  > & {
    schema: TSchema;
    label?: string;
  },
  asyncOptions?: AsyncOptions
) => {
  const { signal, emitter } = asyncOptions || {};
  let requestId = generateId();
  emitter?.emit("llm_start", {
    requestId,
    ...params,
  });
  let result = await vercelGenerateObject<z.infer<TSchema>>({
    ...params,
    abortSignal: signal,
  });
  emitter?.emit("llm_end", { requestId, ...result });

  return result as Omit<
    AsyncReturnType<typeof vercelGenerateObject>,
    "object"
  > & { object: z.infer<TSchema> };
};

export type StreamTextResult = NonNullable<
  Parameters<typeof vercelStreamText>[0]["onFinish"]
> extends (event: infer E) => any
  ? E
  : never;

export type GenerateTextResult = AsyncReturnType<typeof _generateText>;

const _streamText = async (
  params: Parameters<typeof vercelStreamText>[0] & {
    label?: string;
    startSequence?: string;
  },
  asyncOptions?: AsyncOptions
): Promise<StreamTextResult> => {
  const { signal, emitter } = asyncOptions || {};
  let requestId = generateId();

  return new Promise(async (resolve, reject) => {
    emitter?.emit("llm_start", { requestId, ...params });
    try {
      let buffer = "";
      let foundStartSequence = !params.startSequence;

      const stream = vercelStreamText({
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

          if (params.startSequence && result.text) {
            const startIndex = result.text.indexOf(params.startSequence);
            if (startIndex !== -1) {
              result = {
                ...result,
                text: result.text.slice(
                  startIndex + params.startSequence.length
                ),
              };
            }
          }

          emitter?.emit("llm_end", { requestId, ...result });
          resolve(result);
        },
      });

      for await (const chunk of stream.textStream) {
        if (params.startSequence) {
          buffer += chunk;

          if (!foundStartSequence) {
            if (buffer.includes(params.startSequence)) {
              foundStartSequence = true;
              const content = buffer.slice(
                buffer.indexOf(params.startSequence) +
                  params.startSequence.length
              );
              if (content) emitter?.emit("content", content);
            }
            if (buffer.length > params.startSequence.length * 2) {
              buffer = buffer.slice(-params.startSequence.length * 2);
            }
          } else {
            emitter?.emit("content", chunk);
          }
        } else {
          emitter?.emit("content", chunk);
        }
      }
    } catch (err: any) {
      console.error("❌ | streamText err:", err);
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
  params: Omit<Parameters<typeof vercelStreamObject>[0], "output"> & {
    schema: TSchema;
    label?: string;
  },
  asyncOptions?: AsyncOptions
): Promise<StreamDataResult> => {
  const { signal, emitter } = asyncOptions || {};
  let requestId = generateId();

  return new Promise(async (resolve, reject) => {
    emitter?.emit("llm_start", { requestId, ...params });
    try {
      const stream = vercelStreamObject<z.infer<TSchema>>({
        abortSignal: signal,
        output: "object",
        ...params,
        onFinish: (result) => {
          if (result.object) {
            emitter?.emit("data", result.object);
          }
          emitter?.emit("llm_end", { requestId, ...result });
          resolve(result);
        },
      });

      for await (const partialObject of stream.partialObjectStream) {
        emitter?.emit("partial_data", partialObject);
      }
    } catch (err: any) {
      console.error("❌ | streamData err:", err);
      emitter?.emit("error", err);
      reject(err);
    }
  });
};

const _streamTextWithTools = async (
  params: Parameters<typeof vercelStreamText>[0] & {
    maxLoops?: number;
    startSequence?: string;
  },
  asyncOptions?: AsyncOptions
): Promise<StreamTextResult> => {
  const { signal, emitter } = asyncOptions || {};
  let messages: Array<VercelChatMessage> = params.messages || [];
  let loopCount = 0;
  const maxLoops = params.maxLoops || 5;
  let requestId = generateId();

  return new Promise(async (resolve, reject) => {
    emitter?.emit("llm_start", { requestId, ...params });
    let { startSequence, ...restParams } = params;

    const attemptStream = async (): Promise<void> => {
      let forcedResponse: StreamTextResult | GenerateTextResult | null = null;
      try {
        let finalContent = "";
        let buffer = "";
        let foundStartSequence = !startSequence;

        const stream = vercelStreamText({
          ...restParams,
          messages: messages as VercelChatMessages,
          maxRetries: 3,
          abortSignal: signal,
          onFinish: async (result) => {
            emitter?.emit("llm_end", { requestId, ...result });
            if (
              result.toolCalls &&
              result.toolCalls.length > 0 &&
              loopCount < maxLoops
            ) {
              if (result.toolResults) {
                const assistantMessage: CoreMessage = {
                  role: "assistant" as const,
                  content: result.toolCalls
                    .filter(
                      (toolCall) =>
                        result.toolResults &&
                        result.toolResults.some(
                          (r: any) => r.toolCallId === toolCall.toolCallId
                        )
                    )
                    .map((toolCall) => ({
                      type: "tool-call" as const,
                      toolCallId: toolCall.toolCallId,
                      toolName: toolCall.toolName,
                      args: toolCall.args,
                    })),
                };

                if (assistantMessage.content.length > 0) {
                  messages.push(assistantMessage);
                }
                if (result.toolResults && result.toolResults.length > 0) {
                  const toolResultMessage = {
                    role: "tool" as const,
                    content: result.toolResults.map((r: any) => {
                      let result = r.result;
                      if (
                        typeof r.result === "object" &&
                        "toolHandledResponse" in r.result &&
                        "text" in r.result.toolHandledResponse
                      ) {
                        let {
                          toolHandledResponse: newToolHandledResponse,
                          ...rest
                        } = result;
                        forcedResponse = newToolHandledResponse;
                        result = rest;
                      } else {
                        console.log(
                          "🚀 | tool_result is not OJBECT!!!! | result:",
                          result
                        );
                      }
                      emitter?.emit("tool_result", {
                        toolCallId: r.toolCallId,
                        toolName: r.toolName,
                        result: result,
                        toolDefinitionId: r.toolName,
                      });
                      return {
                        type: "tool-result" as const,
                        toolCallId: r.toolCallId,
                        toolName: r.toolName,
                        result: result,
                      };
                    }),
                  };
                  messages.push(toolResultMessage);
                }
              }

              loopCount++;
              const nextResult = forcedResponse
                ? forcedResponse
                : await _streamTextWithTools(
                    {
                      ...params,
                      messages: messages as VercelChatMessages,
                      maxLoops: maxLoops - 1,
                    },
                    asyncOptions
                  );
              resolve({
                ...nextResult,
                toolCalls: [
                  ...(result?.toolCalls || []),
                  ...(nextResult?.toolCalls || []),
                ],
                toolResults: [
                  ...(result?.toolResults || []),
                  ...(nextResult?.toolResults || []),
                ],
              });
            } else {
              emitter?.emit("final_content", finalContent);
              if (startSequence && result.text) {
                const startIndex = result.text.indexOf(startSequence);
                if (startIndex !== -1) {
                  result = {
                    ...result,
                    text: result.text.slice(startIndex + startSequence.length),
                  };
                }
              }
              resolve(result);
            }
          },
        });

        for await (const chunk of stream.fullStream) {
          if (chunk.type === "text-delta") {
            if (startSequence) {
              buffer += chunk.textDelta;

              if (!foundStartSequence) {
                if (buffer.includes(startSequence)) {
                  foundStartSequence = true;
                  const content = buffer.slice(
                    buffer.indexOf(startSequence) + startSequence.length
                  );
                  if (content) {
                    emitter?.emit("content", content);
                    finalContent += content;
                  }
                }
                if (buffer.length > startSequence.length * 2) {
                  buffer = buffer.slice(-startSequence.length * 2);
                }
              } else {
                emitter?.emit("content", chunk.textDelta);
                finalContent += chunk.textDelta;
              }
            } else {
              finalContent += chunk.textDelta;
              emitter?.emit("content", chunk.textDelta);
            }
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
        console.log("🚀 | attemptStream | err:", err);
        if (err.name === "RetryError") {
          console.log("🚀 | RetryError:", err.name, "Rate Limit Exceeded");
          emitter?.emit("log", `ERROR: Rate limit exceeded`);
          forcedResponse = {
            text: "Unable to continue: Rate limit exceeded.",
            toolCalls: [],
            toolResults: [],
            finishReason: "error",
            usage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
            },
          } as any;
          resolve(forcedResponse as StreamTextResult);
        } else {
          throw err;
        }
      }
    };

    try {
      await attemptStream();
    } catch (err: any) {
      console.error("❌ | streamTextWithTools err:", err);
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
