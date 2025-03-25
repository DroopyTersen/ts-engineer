export const countTokens = (text: string) => {
  if (!text) return 0;
  const tokens = Math.ceil(text.length / 4);
  return tokens;
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
