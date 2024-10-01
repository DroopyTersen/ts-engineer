import { transformerNotationHighlight } from "@shikijs/transformers";
import crypto from "crypto";
import { codeToHtml } from "shiki";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { rankFusion } from "~/toolkit/utils/rankFusion";
import { db } from "../db/db.server";
import { SearchFilesCriteria } from "../db/files.db";
import { classifySearchType } from "../llm/search/classifySearchType";
import { rerankSearchResults } from "../llm/search/rerankSearchResults";
import { memoryCache } from "../memoryCache";

export const searchCode = async (
  criteria:
    | SearchFilesCriteria
    | (Omit<SearchFilesCriteria, "query"> & { queries?: string[] })
) => {
  let queries: string[] = [];
  if ("queries" in criteria && criteria.queries?.length) {
    queries = criteria.queries;
  } else if ("query" in criteria) {
    queries = [criteria.query];
  }
  const searchPromises = queries.map(async (query) => {
    let queryClassfication = memoryCache.get(query);
    if (queryClassfication) {
      console.log("🚀 | Cache hit for query classification:", query);
    } else {
      console.log("🚀 | Cache miss for query classification:", query);
      queryClassfication = await classifySearchType(query, {
        llm: getLLM("openai", "gpt-4o-mini"),
      });
      console.log("🚀 | Setting cache for query classification:", query);
      memoryCache.set(query, queryClassfication);
    }

    console.log("🚀 | queryClassfication:", query, queryClassfication);
    let results = await db.searchFiles({
      ...criteria,
      query,
      type: queryClassfication?.type,
      keywordQuery: queryClassfication?.keywordQuery,
      limit: 25,
    });

    // If it's a keyword search and there are no results, retry as a hybrid search
    if (
      queryClassfication?.type === "keyword" &&
      results.results.length === 0
    ) {
      console.log(
        "🚀 | No results for keyword search, retrying as hybrid search"
      );
      queryClassfication.type = "hybrid";
      results = await db.searchFiles({
        ...criteria,
        query,
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
          query,
          resultsToRerank,
          getLLM("openai", "gpt-4o-mini"),
          20
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

    return results.results;
  });

  const allResults = await Promise.all(searchPromises);
  const finalResults = rankFusion((item) => item.id, ...allResults).slice(
    0,
    criteria.limit || 50
  );

  return { results: finalResults };
};

const generateHash = (contents: string) => {
  return crypto.createHash("sha256").update(contents).digest("hex");
};
