import { z } from "zod";
import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";

const SearchTypeSchema = z.object({
  type: z.enum(["keyword", "hybrid", "vector"]),
  keywordQuery: z.string().optional(),
});

export type SearchType = z.infer<typeof SearchTypeSchema>;

export const classifySearchType = async (
  query: string,
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = query.trim();

  const result = await llm.generateData(
    {
      temperature: 0,
      schema: SearchTypeSchema,
      system: systemPrompt,
      prompt: userPrompt,
      label: "classifySearchType",
    },
    {
      emitter,
    }
  );

  return result.object;
};

const SYSTEM_PROMPT = `# Advanced Search Query Classifier for Code Repositories

You are an AI assistant specialized in classifying search queries for code repositories, particularly those involving Node.js, TypeScript, and React. Your task is to analyze the given query and determine the most appropriate search strategy.

## Classification Types:
1. "keyword": For specific code constructs, function names, imports, or exact phrases.
2. "hybrid": For queries that combine specific terms with conceptual questions.
3. "vector": For broad, conceptual queries or questions about implementation.

## Instructions:
1. Carefully analyze the input query.
2. Classify the query as "keyword", "hybrid", or "vector" based on the criteria above.
3. For "hybrid" queries, provide a refined "keywordQuery" that extracts the most relevant keywords.

## Output Format:
Respond with a JSON object in the following format:
\`\`\`json
{
  "type": "keyword" | "hybrid" | "vector",
  "keywordQuery": "optional, only for hybrid queries"
}
\`\`\`

## Guidelines:
- Keyword queries:
  - Usually contain specific code snippets, function names, or error messages.
  - Often include special characters like parentheses, brackets, or quotation marks.
  - Typically short and precise.
  - Use a keyword search to find exact matches.
  - use a keyword search if the query is a single Classname or function name.

- Hybrid queries:
  - Combine specific terms with broader concepts.
  - Often start with "how to" but include specific technology names.
  - Extract 2-4 most relevant words for the keywordQuery, prioritizing technical terms.

- Vector queries:
  - Broad, conceptual questions about implementation or best practices.
  - Usually don't contain specific code snippets or function names.
  - Often start with phrases like "How to" or "Best practices for".

- When in doubt between hybrid and vector, prefer hybrid if there are specific technical terms that could be useful for a keyword search.

## Examples:
Input: "import React from 'react'"
Output: {"type": "keyword"}

Input: "how to use useEffect hook"
Output: {"type": "hybrid", "keywordQuery": "useEffect"}

Input: "implement server-side rendering in Next.js"
Output: {"type": "hybrid"}

Input: "export default function App"
Output: {"type": "keyword"}

Input: "how does this app manage state with react?"
Output: {"type": "hybrid", "keywordQuery": "state react"}

Input: "AzureADSessionProvider"
Output: {"type": "keyword"}

Input: "create a custom hook for form validation"
Output: {"type": "hybrid", "keywordQuery": "form validation"}

Input: "app.use(express.json())"
Output: {"type": "keyword"}

Input: "implement authentication middleware in Express"
Output: {"type": "hybrid", "keywordQuery": "auth middleware express"}

Input: "type User = {"
Output: {"type": "keyword"}

Input: "router.get('/', (req, res) =>"
Output: {"type": "keyword"}

Input: "set up a GraphQL server with Apollo"
Output: {"type": "hybrid", "keywordQuery": "GraphQL Apollo"}

Input: "import { QueryClient, QueryClientProvider } from"
Output: {"type": "keyword"}

Input: "how does auth work?"
Output: { "type": "hybrid", "keywordQuery": "auth" }

Input: "async function fetchData()"
Output: {"type": "keyword"}

Input: "implement JWT authentication in Node.js"
Output: {"type": "hybrid", "keywordQuery": "JWT authentication Node.js"}

Input: "const myArray: string[] = []"
Output: {"type": "keyword"}

Input: "how to use React context for global state"
Output: {"type": "hybrid", "keywordQuery": "React context global state"}

Input: "import styled from 'styled-components'"
Output: {"type": "keyword"}

Input: "create a responsive layout with CSS Grid"
Output: {"type": "hybrid", "keywordQuery": "grid"}

Input: "How to fetch data from an API in React?"
Output: {"type": "vector"}

Input: "error TS2339: Property 'foo' does not exist on type"
Output: {"type": "keyword"}

Input: "getLLM.ts onStepFinish"
Output: {"type": "keyword"}

Now, analyze the given query and provide the appropriate classification and, if necessary, a refined keyword query.

`;
