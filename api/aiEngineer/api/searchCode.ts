import { transformerNotationHighlight } from "@shikijs/transformers";
import { codeToHtml } from "shiki";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { db } from "../db/db.server";
import { SearchFilesCriteria } from "../db/files.db";
import { classifySearchType } from "../llm/search/classifySearchType";
import { rerankSearchResults } from "../llm/search/rerankSearchResults";

export const searchCode = async (criteria: SearchFilesCriteria) => {
  let queryClassfication = await classifySearchType(criteria.query, {
    llm: getLLM("openai", "gpt-4o-mini"),
  });
  console.log("🚀 | queryClassfication:", criteria.query, queryClassfication);

  let results = await db.searchFiles({
    ...criteria,
    type: queryClassfication?.type,
    keywordQuery: queryClassfication?.keywordQuery,
  });
  if (queryClassfication?.type !== "keyword") {
    results.results = await rerankSearchResults(
      criteria.query,
      results.results,
      getLLM("openai", "gpt-4o-mini")
    );
  }
  // Syntax highlight the snippets
  for (let result of results.results) {
    if (result.snippet && result.extension) {
      result.snippet = await codeToHtml(result.snippet, {
        lang: result.extension,
        theme: "slack-dark",
        transformers: [transformerNotationHighlight({})],
      });
    }
  }

  return results;
};
