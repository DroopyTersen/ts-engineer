import type { ProjectClassification } from "@shared/db.schema";
import { getLLM } from "~/toolkit/ai/llm/getLLM";

export const getLLMByClassification = (
  classification?: ProjectClassification
) => {
  if (classification === "work") {
    return getLLM("azure", "gpt-4o");
  }
  if (classification === "public") {
    return getLLM("deepseek", "deepseek-chat");
  }
  return getLLM("anthropic", "claude-3-5-sonnet-20241022");
};
