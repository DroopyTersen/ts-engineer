import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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
  workAnthropic: createAnthropic({
    apiKey: process.env.COREBTS_ANTHROPIC_API_KEY!,
  }),
  deepseek: createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
  }),
  google: createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY!,
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
    // large: modelProviders.azure(process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!),
    large: modelProviders.workAnthropic("claude-3-7-sonnet-20250219"),
    // tools: modelProviders.azure(process.env.AZURE_OPENAI_LLM_DEPLOYMENT_NAME!),
    tools: modelProviders.workAnthropic("claude-3-7-sonnet-20250219"),
    reasoner: modelProviders.workAnthropic("claude-3-7-sonnet-20250219"),
  } as const,
  textEmbeddingModels: {
    embedding: modelProviders.azure.textEmbeddingModel(
      process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!
    ),
  } as const,
});

const privateProvider = customProvider({
  languageModels: {
    small: modelProviders.google("gemini-2.0-flash-001"),
    small_structured: modelProviders.google("gemini-2.0-flash-001"),
    large: modelProviders.anthropic("claude-3-7-sonnet-20250219"),
    tools: modelProviders.anthropic("claude-3-7-sonnet-20250219"),
    reasoner: modelProviders.anthropic("claude-3-7-sonnet-20250219"),
  } as const,
  textEmbeddingModels: {
    embedding: modelProviders.openai.textEmbeddingModel(
      "text-embedding-3-small"
    ),
  } as const,
});

let publicProvider = customProvider({
  languageModels: {
    small: modelProviders.google("gemini-2.0-flash-001"),
    small_structured: modelProviders.google("gemini-2.0-flash-001"),
    large: modelProviders.google("gemini-2.5-pro-exp-03-25"), // modelProviders.anthropic("claude-3-7-sonnet-20250219"),
    tools: modelProviders.google("gemini-2.5-pro-exp-03-25"), // modelProviders.anthropic("claude-3-7-sonnet-20250219"),
    reasoner: modelProviders.google("gemini-2.5-pro-exp-03-25"), // modelProviders.deepseek("claude-3-7-sonnet-20250219"),
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
