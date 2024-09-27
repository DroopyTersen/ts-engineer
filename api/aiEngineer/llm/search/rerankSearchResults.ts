import { SearchFilesResponse } from "api/aiEngineer/db/files.db";
import { z } from "zod";
import { LLM } from "~/toolkit/ai/llm/getLLM";

const RerankResponseSchema = z.object({
  relevant_indices: z.array(z.number()),
});

export const rerankSearchResults = async (
  query: string,
  results: SearchFilesResponse["results"],
  llm: LLM,
  k: number = 10
) => {
  // Prepare the summaries with their indices
  const summaries = results
    .map(
      (result, i) => `[${i}] ${result.filepath}
${result.summary}
${result?.snippet || result?.content?.slice(0, 1000) + "..." || ""}`
    )
    .join("\n\n------\n\n");

  const prompt = `
    Query: ${query}
    You are about to be given a group of documents, each preceded by its index number in square brackets. Your task is to select the ${k} most relevant documents from the list to help us answer the query.
    
    <documents>
    ${summaries}
    </documents>

    Output only the indices of ${k} most relevant documents in order of relevance, separated by commas, enclosed in XML tags here:
    <relevant_indices>put the numbers of your indices here, separated by commas</relevant_indices>
  `;

  const response = await llm.generateData({
    temperature: 0,
    schema: RerankResponseSchema,
    prompt,
    label: "rerankSearchResults",
  });

  const relevantIndices = response.object.relevant_indices;

  // Ensure we don't have out-of-range indices
  const validIndices = relevantIndices.filter((idx) => idx < results.length);

  // Return the reranked results
  const rerankedResults = validIndices.map((idx) => results[idx]);

  return rerankedResults;
};
