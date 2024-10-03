import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

export const embedTexts = async (
  values: string[],
  {
    model = "text-embedding-3-small",
    dimensions = 1024,
  }: {
    model?: "text-embedding-3-small" | "text-embedding-3-large";
    dimensions?: number;
  } = {
    model: "text-embedding-3-small",
    dimensions: 1024,
  }
): Promise<number[][]> => {
  let openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const result = await embedMany({
    model: openai.embedding(model, {
      dimensions,
    }),
    values,
  });

  return result.embeddings.map((embedding) => embedding);
};
