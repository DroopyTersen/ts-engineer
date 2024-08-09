import { z } from "zod";
import { jsonRequest } from "~/toolkit/http/fetch.utils";

import { tool } from "ai";

export const SearchWebInput = z.object({
  q: z.string().describe("The search query string"),
  freshness: z
    .enum(["pd", "pw", "pm", "py", "none"])
    .optional()
    .default("none")
    .describe(
      "Filters search results by when they were discovered. Supported values: 'pd' (last 24 hours), 'pw' (last 7 days), 'pm' (last 31 days), 'py' (last 365 days), 'none' (no filter). A timeframe can also be specified using the format YYYY-MM-DD:YYYY-MM-DD."
    ),
  result_filter: z
    .string()
    .optional()
    .default("web")
    .describe(
      `A comma delimited string of result types to include in the search response. Available values: discussions, faq, infobox, news, query, summarizer, videos, web. 
      
      Default is 'web'. Stick to the default, web, unless the user asks for something else specific.
      
      Example: 'discussions,videos' returns only query, discussions, and videos responses.`
    ),
  site: z
    .string()
    .optional()
    .describe(
      "Limits search results to a specific website domain. For example you could pass: 'brave.com' or 'remix.run' or 'bun.sh' or 'apnews.com'"
    ),
});
export type SearchWebInput = z.infer<typeof SearchWebInput>;

export const searchWebTool = tool({
  description:
    "Searches the web for the given query and returns relevant results. Always call the readUrl tool after searchWeb in order to get more information about promising looking urls. Often the search web result description is misleading, so you should always use the readUrl tool to get more information if the result looks like it could help you answer the user's question.",
  parameters: SearchWebInput,
  execute: async (args) => {
    try {
      const result = await searchWeb(args);
      return result;
    } catch (error) {
      console.error("Error searching web:", error);
      return { error: "Failed to search web" };
    }
  },
});

export const SearchWebResultItem = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string(),
  page_age: z.string().optional(),
  profile: z.object({
    name: z.string(),
  }),
  meta_url: z
    .object({
      hostname: z.string(),
      path: z.string().optional(),
    })
    .optional(),
});

export const SearchWebResult = z.object({
  query: z.object({
    original: z.string().describe("The original search query"),
  }),
  web: z.object({
    results: z.array(SearchWebResultItem),
  }),
});

export type SearchWebResult = z.infer<typeof SearchWebResult>;

export const searchWeb = async (input: SearchWebInput) => {
  try {
    let searchParams = new URLSearchParams(input);
    const result = await jsonRequest(
      `https://api.search.brave.com/res/v1/web/search?${searchParams.toString()}`,
      {
        headers: {
          "X-Subscription-Token": process.env.BRAVE_API_KEY!,
        },
      }
    );

    let parsedResult = SearchWebResult.safeParse(result);
    if (!parsedResult.success) {
      throw new Error("Failed to parse search web result", {
        cause: parsedResult.error,
      });
    }

    return parsedResult.data;
  } catch (error) {
    console.error("Error searching the web:", error);
    throw error;
  }
};
