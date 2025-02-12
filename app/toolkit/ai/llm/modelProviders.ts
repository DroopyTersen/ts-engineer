import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { ProjectClassification } from "@shared/db.schema";
import { customProvider } from "ai";
import "./bunPolyfill";

export const modelProviders = {
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  }),
  anthropic: createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  }),
  deepseek: createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
  }),
  azure: createAzure({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    resourceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
  }),
};

let workProvider = customProvider({
  languageModels: {
    small: modelProviders.azure(
      process.env.AZURE_OPENAI_FAST_LLM_DEPLOYMENT_NAME!
    ),
    small_structured: modelProviders.azure(
      process.env.AZURE_OPENAI_FAST_LLM_DEPLOYMENT_NAME!,
      {
        // Model deployment doesn't support this. need newer version
        // structuredOutputs: true,
      }
    ),
    large: modelProviders.azure(process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!),
    tools: modelProviders.azure(process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!),
    reasoner: modelProviders.azure(
      process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!
    ),
  } as const,
  textEmbeddingModels: {
    embedding: modelProviders.azure.textEmbeddingModel(
      process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!
    ),
  } as const,
});

const privateProvider = customProvider({
  languageModels: {
    small: modelProviders.openai("gpt-4o-mini"),
    small_structured: modelProviders.openai("gpt-4o-mini", {
      structuredOutputs: true,
    }),
    large: modelProviders.anthropic("claude-3-5-sonnet-20241022"),
    tools: modelProviders.anthropic("claude-3-5-sonnet-20241022"),
    reasoner: modelProviders.openai("o3-mini"),
  } as const,
  textEmbeddingModels: {
    embedding: modelProviders.openai.textEmbeddingModel(
      "text-embedding-3-small"
    ),
  } as const,
});

let publicProvider = customProvider({
  languageModels: {
    small: modelProviders.openai("gpt-4o-mini"),
    small_structured: modelProviders.openai("gpt-4o-mini", {
      structuredOutputs: true,
    }),
    large: modelProviders.anthropic("claude-3-5-sonnet-20241022"),
    tools: modelProviders.anthropic("claude-3-5-sonnet-20241022"),
    reasoner: modelProviders.deepseek("deepseek-reasoner"),
  } as const,
  textEmbeddingModels: {
    embedding: modelProviders.openai.textEmbeddingModel(
      "text-embedding-3-small"
    ),
  } as const,
});

export const classificationProviders = {
  work: workProvider,
  private: privateProvider,
  public: publicProvider,
} as const;

export const chooseModel = (
  classification: ProjectClassification,
  type: Parameters<typeof classificationProviders.work.languageModel>[0]
) => {
  return classificationProviders?.[classification]?.languageModel?.(type);
};
