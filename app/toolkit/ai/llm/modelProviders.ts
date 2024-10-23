import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import "./bunPolyfill";

export const MODEL_PROVIDERS = {
  azure: {
    create: createAzure({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      resourceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
    }),
    models: {
      "gpt-4o": process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!,
      "gpt-4o-mini": process.env.AZURE_OPENAI_FAST_LLM_DEPLOYMENT_NAME!,
    },
  },
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
    models: {
      "gpt-4o": "gpt-4o",
      "gpt-4o-mini": "gpt-4o-mini",
      "o1-mini": "o1-mini",
    },
  },
  anthropic: {
    create: createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    }),
    models: {
      "claude-3-5-sonnet-20241022": "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620": "claude-3-5-sonnet-20240620",
    },
  },
};

export type ModelProvider = keyof typeof MODEL_PROVIDERS;
