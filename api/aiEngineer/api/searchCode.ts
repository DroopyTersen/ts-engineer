import { transformerNotationHighlight } from "@shikijs/transformers";
import crypto from "crypto";
import { codeToHtml } from "shiki";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { db } from "../db/db.server";
import { SearchFilesCriteria } from "../db/files.db";
import { classifySearchType } from "../llm/search/classifySearchType";
import { rerankSearchResults } from "../llm/search/rerankSearchResults";
import { memoryCache } from "../memoryCache";
export const searchCode = async (criteria: SearchFilesCriteria) => {
  let queryClassfication = memoryCache.get(criteria.query);
  if (queryClassfication) {
    console.log("🚀 | Cache hit for query classification:", criteria.query);
  } else {
    console.log("🚀 | Cache miss for query classification:", criteria.query);
    queryClassfication = await classifySearchType(criteria.query, {
      llm: getLLM("openai", "gpt-4o-mini"),
    });
    console.log("🚀 | Setting cache for query classification:", criteria.query);
    memoryCache.set(criteria.query, queryClassfication);
  }

  console.log("🚀 | queryClassfication:", criteria.query, queryClassfication);
  let results = await db.searchFiles({
    ...criteria,
    type: queryClassfication?.type,
    keywordQuery: queryClassfication?.keywordQuery,
  });

  // If it's a keyword search and there are no results, retry as a hybrid search
  if (queryClassfication?.type === "keyword" && results.results.length === 0) {
    console.log(
      "🚀 | No results for keyword search, retrying as hybrid search"
    );
    queryClassfication.type = "hybrid";
    results = await db.searchFiles({
      ...criteria,
      type: queryClassfication.type,
      keywordQuery: queryClassfication.keywordQuery,
    });
  }

  if (queryClassfication?.type !== "keyword") {
    const resultsToRerank = results.results.slice(0, 50);
    const rerankCacheKey = `rerank: ${generateHash(
      JSON.stringify({ criteria, resultsToRerank })
    )}`;
    const cachedRerankedResults = memoryCache.get(rerankCacheKey);

    if (cachedRerankedResults) {
      console.log("🚀 | Cache hit for reranked results:", rerankCacheKey);
      results.results = cachedRerankedResults;
    } else {
      console.log("🚀 | Cache miss for reranked results:", rerankCacheKey);
      const rerankedResults = await rerankSearchResults(
        criteria.query,
        resultsToRerank,
        getLLM("openai", "gpt-4o-mini")
      );
      console.log("🚀 | Setting cache for reranked results:", rerankCacheKey);
      memoryCache.set(rerankCacheKey, rerankedResults);
      results.results = rerankedResults;
    }
  }
  await Promise.all(
    results.results.map(async (result) => {
      if (
        result.snippet &&
        result.extension &&
        !result.snippet.startsWith("<pre")
      ) {
        result.snippet = await codeToHtml(result.snippet, {
          lang: result.extension,
          theme: "slack-dark",
          transformers: [transformerNotationHighlight({})],
        });
      }
    })
  );

  return results;
};

const generateHash = (contents: string) => {
  return crypto.createHash("sha256").update(contents).digest("hex");
};
