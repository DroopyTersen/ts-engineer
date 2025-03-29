import { tool } from "ai";
import { z } from "zod";
import { jsonRequest } from "~/toolkit/http/fetch.utils";

export const readUrlTool = tool({
  description:
    "Fetches the content of a given URL and returns it as markdown text. This tool is useful for retrieving up-to-date information from web pages, which can then be used for further processing or analysis.",
  parameters: z.object({
    url: z
      .string()
      .describe(
        "The URL of the webpage to read. Must be a valid, publicly accessible URL."
      ),
  }),
  execute: (args) => {
    return readUrl(args.url);
  },
});

export type JinaReaderResult = {
  code: number;
  status: number;
  data: {
    title: string;
    url: string;
    content: string;
  };
};
export const readUrl = async (url: string) => {
  try {
    let result = await jsonRequest<JinaReaderResult>(
      `https://r.jina.ai/${url}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.JINA_API_KEY}`,
          Accept: "application/json",
        },
      }
    );
    console.log("🚀 | readUrl | result:", {
      url: result?.data.url,
      title: result?.data.title,
      content: result?.data.content.substring(0, 240),
    });
    return result;
  } catch (error) {
    console.error("Error fetching URL:", error);
    return { url, error: "Failed to fetch URL content" };
  }
};
