import { OpenAI } from "openai";
import { OpenAITypes } from "./openai.types";

const DEFAULT_MODEL = "gpt-4o";

export const LLM_DEFAULTS = {
  model: DEFAULT_MODEL,
  temperature: 0.1,
  max_tokens: 2000,
  stream: true,
} satisfies Partial<OpenAITypes.ChatParams>;

export const createOpenAIClient = (mode: string = "azure") => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    maxRetries: 2,
  });
};

export const embedTexts = async (
  values: string[],
  dimensions: number = 1024
): Promise<number[][]> => {
  let openai = createOpenAIClient("openai");
  let result = await openai.embeddings.create({
    input: values,
    model: "text-embedding-3-small",
    dimensions,
  });
  return result.data.map((embedding) => embedding.embedding);
};
