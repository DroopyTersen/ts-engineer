import { encode, encodeChat } from "gpt-tokenizer";
export const countTokens = (text: string) => {
  if (!text) return 0;
  const tokens = encode(text);
  return tokens.length;
};

export const countConversationTokens = (messages: any[]) => {
  if (!messages || messages.length === 0) return 0;

  let tokens = encodeChat(messages as any[], "gpt-4");
  return tokens.length;
};

export function estimateTokenCost(
  inputTokenCount: number,
  outputTokenCount: number,
  config: { inputCostPerMillion?: number; outputCostPerMillion?: number } = {}
): number {
  const inputCostPerMillion = config.inputCostPerMillion ?? 3;
  const outputCostPerMillion = config.outputCostPerMillion ?? 15;

  const inputCost = (inputTokenCount / 1_000_000) * inputCostPerMillion;
  const outputCost = (outputTokenCount / 1_000_000) * outputCostPerMillion;

  return inputCost + outputCost;
}
