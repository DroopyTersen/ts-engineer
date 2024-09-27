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

Now, analyze the given query and provide the appropriate classification and, if necessary, a refined keyword query.

`;
let examples = [
  {
    input: "import React from 'react'",
    output: { type: "keyword" },
  },
  {
    input: "how to use useEffect hook",
    output: { type: "hybrid", keywordQuery: "useEffect" },
  },
  {
    input: "implement server-side rendering in Next.js",
    output: {
      type: "vector",
    },
  },
  {
    input: "export default function App",
    output: { type: "keyword" },
  },
  {
    input: "how does this app manage state with react?",
    output: {
      type: "hybrid",
      keywordQuery: "state react",
    },
  },
  {
    input: "create a custom hook for form validation",
    output: { type: "hybrid", keywordQuery: "form validation" },
  },
  {
    input: "app.use(express.json())",
    output: { type: "keyword" },
  },
  {
    input: "implement authentication middleware in Express",
    output: {
      type: "hybrid",
      keywordQuery: "auth middleware express",
    },
  },
  {
    input: "type User = {",
    output: { type: "keyword" },
  },
  {
    input: "router.get('/', (req, res) =>",
    output: { type: "keyword" },
  },
  {
    input: "set up a GraphQL server with Apollo",
    output: { type: "hybrid", keywordQuery: "GraphQL Apollo" },
  },
  {
    input: "import { QueryClient, QueryClientProvider } from",
    output: { type: "keyword" },
  },
  {
    input: "async function fetchData()",
    output: { type: "keyword" },
  },
  {
    input: "implement JWT authentication in Node.js",
    output: {
      type: "hybrid",
      keywordQuery: "JWT authentication Node.js implementation",
    },
  },
  {
    input: "const myArray: string[] = []",
    output: { type: "keyword" },
  },
  {
    input: "how to use React context for global state",
    output: {
      type: "hybrid",
      keywordQuery: "React context global state usage",
    },
  },
  {
    input: "import styled from 'styled-components'",
    output: { type: "keyword" },
  },
  {
    input: "create a responsive layout with CSS Grid",
    output: { type: "hybrid", keywordQuery: "grid" },
  },
  {
    input: "class MyComponent extends React.Component",
    output: { type: "keyword" },
  },
  {
    input: "implement infinite scrolling in React",
    output: {
      type: "hybrid",
      keywordQuery: "React infinite scrolling",
    },
  },
  {
    input: "const router = express.Router()",
    output: { type: "keyword" },
  },
  {
    input: "import { createSlice } from '@reduxjs/toolkit'",
    output: { type: "keyword" },
  },
  {
    input: "set up unit testing with Vitest and React Testing Library",
    output: {
      type: "hybrid",
      keywordQuery: "vitest test react-testing-library",
    },
  },
  {
    input: "const schema = new mongoose.Schema({",
    output: { type: "keyword" },
  },
  {
    input: "implement OAuth2 authentication flow",
    output: {
      type: "hybrid",
      keywordQuery: "OAuth2 authentication flow implementation",
    },
  },
  {
    input: "import axios from 'axios'",
    output: { type: "keyword" },
  },
  {
    input: "how to use React Suspense for code splitting",
    output: {
      type: "hybrid",
      keywordQuery: "React Suspense code splitting usage",
    },
  },
  {
    input: "const { data, error } = useSWR(",
    output: { type: "keyword" },
  },
  {
    input: "implement real-time updates with WebSockets",
    output: {
      type: "hybrid",
      keywordQuery: "WebSockets real-time updates implementation",
    },
  },
  {
    input: "const handleSubmit = (e: React.FormEvent) =>",
    output: { type: "keyword" },
  },
  {
    input: "create a custom ESLint rule for TypeScript",
    output: { type: "hybrid", keywordQuery: "custom ESLint rule TypeScript" },
  },
  {
    input: "import { useQuery } from '@apollo/client'",
    output: { type: "keyword" },
  },
  {
    input: "how to implement server-side pagination",
    output: {
      type: "hybrid",
      keywordQuery: "server-side pagination implementation",
    },
  },
  {
    input: "const memoizedValue = useMemo(() =>",
    output: { type: "keyword" },
  },
  {
    input: "set up a CI/CD pipeline for a Node.js app",
    output: { type: "hybrid", keywordQuery: "CI/CD pipeline Node.js setup" },
  },
  {
    input: "export interface Props {",
    output: { type: "keyword" },
  },
  {
    input: "implement drag and drop functionality in React",
    output: {
      type: "hybrid",
      keywordQuery: "React drag and drop implementation",
    },
  },
  {
    input: "app.listen(process.env.PORT, () =>",
    output: { type: "keyword" },
  },
  {
    input: "how to use TypeScript mapped types",
    output: { type: "hybrid", keywordQuery: "TypeScript mapped types usage" },
  },
  {
    input: "import { configureStore } from '@reduxjs/toolkit'",
    output: { type: "keyword" },
  },
  {
    input: "implement role-based access control in Express",
    output: {
      type: "hybrid",
      keywordQuery: "role-based access control Express implementation",
    },
  },
  {
    input: "const MyComponent: React.FC<Props> = ({",
    output: { type: "keyword" },
  },
  {
    input: "create a custom webpack configuration for React",
    output: {
      type: "hybrid",
      keywordQuery: "custom webpack configuration React",
    },
  },
  {
    input: "useLayoutEffect",
    output: {
      type: "keyword",
    },
  },
  {
    input: "How to fetch data from an API in React?",
    output: {
      type: "vector",
    },
  },
  {
    input: "error TS2339: Property 'foo' does not exist on type",
    output: {
      type: "keyword",
    },
  },
  {
    input: "Implement authentication in a Node.js server",
    output: {
      type: "vector",
    },
  },
  {
    input: "useLayoutEffect?",
    output: {
      type: "keyword",
    },
  },
  {
    input: "import express from 'express';",
    output: {
      type: "keyword",
    },
  },
  {
    input: "Cannot find module 'react-router-dom'",
    output: {
      type: "keyword",
    },
  },
  {
    input: "How to set up Redux with TypeScript?",
    output: {
      type: "hybrid",
      keywordQuery: "Redux",
    },
  },
  {
    input: "function componentDidMount() {",
    output: {
      type: "keyword",
    },
  },
  {
    input: "Best practices for handling forms in React",
    output: {
      type: "hybrid",
      keywordQuery: "form React",
    },
  },
  {
    input: "const server = http.createServer(app);",
    output: {
      type: "keyword",
    },
  },
  {
    input: "const result = await Promise.all(promises);",
    output: {
      type: "keyword",
    },
  },
  {
    input: "How to use context API in React?",
    output: {
      type: "hybrid",
      keywordQuery: "context react",
    },
  },
  {
    input: "const router = express.Router();",
    output: {
      type: "keyword",
    },
  },
  {
    input: "UnhandledPromiseRejectionWarning",
    output: {
      type: "keyword",
    },
  },
  {
    input: "How to implement routing in React?",
    output: {
      type: "hybrid",
      keywordQuery: "route react",
    },
  },
];
