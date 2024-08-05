import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";
import { ChatCompletionStream } from "openai/lib/ChatCompletionStream.mjs";
import { z } from "zod";
import { Prettify } from "~/toolkit/utils/typescript.utils";
import { defineOpenAIFunction } from "../../../ai/prompts/defineOpenAIFunction";

const DEFAULT_MODEL = "gpt-4-turbo-preview";

export type OpenAIChatParams = Prettify<
  Omit<Partial<OpenAI.Chat.ChatCompletionCreateParams>, "messages"> & {
    messages: { role: string; content?: string | null; name?: string }[];
  }
>;
const SEED = 9121987;
export const LLM_DEFAULTS = {
  model: DEFAULT_MODEL,
  temperature: 0.2,
  frequency_penalty: 0.5,
  max_tokens: 800,
  seed: SEED,
  stream: true,
} satisfies Partial<OpenAI.Chat.ChatCompletionCreateParams>;

export const getAzureOpenAIInstance = () => {
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const apiKey = process.env["AZURE_OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "The AZURE_OPENAI_API_KEY environment variable is missing or empty."
    );
  }

  // Azure OpenAI requires a custom baseURL, api-version query param, and api-key header.
  const openai = new OpenAI({
    apiKey,
    // fetch: nodeFetch,

    baseURL: `${process.env.OPENAI_API_BASE}/gpt-4`,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { "api-key": apiKey },
    maxRetries: 2,
  });

  return openai;
};

export const getOpenAIInstance = () => {
  if (process.env.AZURE_OPENAI_API_KEY) {
    return getAzureOpenAIInstance();
  }
  // @ts-ignore
  const fetch = (...args) =>
    // @ts-ignore
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
    // @ts-expect-error
    fetch: fetch,
  });
};

export type OpenAIStreamOptions = {
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
  // onFunctionCall?: <TArgs>(functionName: string, args: TArgs) => void;
  onStart?: (llmParams: OpenAIChatParams) => void;
  onComplete?: (finalResult: string, llmParams?: OpenAIChatParams) => void;
  onError?: (error: Error, llmParams?: OpenAIChatParams) => void;
};

export const llmService = {
  stream: (
    chatParams: OpenAIChatParams,
    streamOptions?: OpenAIStreamOptions
  ) => {
    let openAI = getOpenAIInstance();
    let fullChatParams = mergeChatParams(chatParams) as OpenAIChatParams;
    let openAIStream = streamChatCompletion(openAI, fullChatParams, {
      signal: streamOptions?.signal,
    });
    if (streamOptions?.onStart) {
      openAIStream.on("connect", () => {
        streamOptions.onStart?.(fullChatParams);
      });
    }
    if (streamOptions?.onDelta) {
      openAIStream.on("content", (delta) => {
        // console.log("🚀 | delta", delta);
        // encode delta as utf-8 then decode it as utf-8 to remove any non-utf-8 characters
        let utf8Decoded = decodeURIComponent(encodeURIComponent(delta));

        streamOptions.onDelta?.(utf8Decoded);
      });
    }
    if (streamOptions?.onComplete) {
      openAIStream.on("finalContent", (finalContent) => {
        streamOptions.onComplete?.(finalContent, fullChatParams);
      });
    }
    openAIStream.on("error", (error) => {
      console.error("LLM Service Stream Error", error);
      if (streamOptions?.onError) {
        streamOptions.onError?.(error, fullChatParams);
      }
    });
    return openAIStream;
  },
  extractSchema: async <TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    llmParams: OpenAIChatParams,
    streamOptions?: Omit<OpenAIStreamOptions, "onDelta">
  ) => {
    type TArgs = z.infer<TSchema>;
    let fullChatParams = mergeChatParams(llmParams);
    let openAI = getOpenAIInstance();
    const fakeFnName = "extractSchema";
    let openAIFunctionDef = defineOpenAIFunction(fakeFnName, schema);
    let tempFn: any;
    let promise: Promise<TArgs> = new Promise((resolve, reject) => {
      tempFn = (result: TArgs) => {
        resolve(result);
      };
    });
    let openAIStream = await openAI.beta.chat.completions.runFunctions({
      ...fullChatParams,
      function_call: {
        name: openAIFunctionDef.name,
      },
      functions: [
        {
          ...openAIFunctionDef,
          function: tempFn,
          parse: (input: string) => schema.parse(JSON.parse(input)),
        },
      ],
      stream: false,
    });
    let chatParamsForLogging: any = {
      ...fullChatParams,
      function_call: {
        name: openAIFunctionDef.name,
      },
      functions: [openAIFunctionDef],
    };
    if (streamOptions?.onStart) {
      openAIStream.on("connect", () => {
        streamOptions.onStart?.(chatParamsForLogging);
      });
    }

    if (streamOptions?.onError) {
      openAIStream.on("error", (error) => {
        streamOptions.onError?.(error, chatParamsForLogging);
      });
    }

    return promise
      .then((result) => {
        if (streamOptions?.onComplete) {
          streamOptions.onComplete?.(
            JSON.stringify(result),
            chatParamsForLogging
          );
        }
        return result;
      })
      .catch((error) => {
        if (streamOptions?.onError) {
          streamOptions.onError?.(error, chatParamsForLogging);
        }
        throw error;
      });
  },
  getCompletion: async (chatParams: OpenAIChatParams) => {
    let openAI = getOpenAIInstance();
    let fullChatParams = mergeChatParams({
      ...chatParams,
      stream: false,
    });
    let result = (await openAI.chat.completions.create(
      fullChatParams
    )) as OpenAI.Chat.Completions.ChatCompletion;
    return result?.choices?.[0]?.message?.content || "";
  },
  waitForStream: waitForStream,
  createTextResponse: createTextResponse,
  createReadableStream: createReadableStream,
};

export const mergeChatParams = (chatParams: OpenAIChatParams) => {
  return {
    ...LLM_DEFAULTS,
    ...chatParams,
    messages: chatParams?.messages?.filter((m) => m?.content !== undefined),
  } as OpenAI.Chat.ChatCompletionCreateParams;
};

export const streamChatCompletionOld = async (
  openAI: OpenAI,
  chatParams: OpenAIChatParams,
  onDelta?: (chunk: string) => void
) => {
  let fullChatParams = mergeChatParams(chatParams);
  let openAIStream = await openAI.chat.completions.create({
    ...fullChatParams,
    stream: true,
  });

  let fullText = "";
  for await (const chunk of openAIStream) {
    let delta = chunk.choices[0]?.delta?.content;
    // console.log(JSON.stringify(chunk, null, 2));
    if (delta) {
      console.log("🚀 | forawait | delta:", delta);
      if (onDelta) {
        onDelta(delta);
      }
      fullText += delta;
    }
  }
  return fullText;
};
export const streamChatCompletion = (
  openAI: OpenAI,
  chatParams: OpenAIChatParams,
  requestOptions?: {
    signal?: AbortSignal;
  }
) => {
  let fullChatParams = mergeChatParams({
    ...chatParams,
    stream: true,
  });
  let openAIStream = openAI.beta.chat.completions.stream({
    ...fullChatParams,
    stream: true,
  });

  if (requestOptions?.signal) {
    requestOptions.signal.addEventListener("abort", () => {
      openAIStream.abort();
    });
  }
  openAIStream.on("abort", (abort) => {
    console.log("🚀 | Chat completion request aborted");
  });
  return openAIStream;
};

function waitForStream(
  chatCompletionStream: ChatCompletionStream
): Promise<string> {
  return new Promise((resolve, reject) => {
    chatCompletionStream.on("abort", (error) => {
      resolve("");
    });
    chatCompletionStream.on("error", (error) => {
      reject(error);
    });
    chatCompletionStream.on("finalContent", (result) => {
      resolve(result);
    });
  });
}
function createTextResponse(chatCompletionStream: ChatCompletionStream) {
  return new StreamingTextResponse(OpenAIStream(chatCompletionStream));
}

function createReadableStream(chatCompletion: ChatCompletionStream) {
  return OpenAIStream(chatCompletion);
}
