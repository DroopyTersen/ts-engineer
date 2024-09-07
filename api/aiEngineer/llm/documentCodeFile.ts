import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";

export const documentCodeFile = async (
  filepath: string,
  fileContents: string,
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  let systemPrompt = createSystemPrompt();
  let userPrompt = `
Filepath: ${filepath}
\`\`\`
${fileContents}
\`\`\`
      `.trim();

  let result = await llm.streamText(
    {
      maxTokens: 1000,
      temperature: 0.2,
      system: systemPrompt,
      prompt: userPrompt,
    },

    {
      emitter,
    }
  );
  return result.text;
};

const createSystemPrompt = () => {
  return `You are an expert software engineer specializing in API documentation. Your task is to analyze the provided source code file and generate a concise, informative documentation snippet focused on its public interface and overall purpose. Focus on documenting how a Junior developer could leverage the code. Document the code in a way where they could use the code without having to look at the full source code.
  
Follow these guidelines:

1. Include ONLY publicly exposed elements (exported classes, methods, functions, constants) that are part of the API.
2. For each public element:
   - Provide a comment explaining its purpose.
   - Include the element's signature without implementation details.

Important:
- Document ONLY publicly exposed (exported) elements. If a developer can't use something because it's private or internal, it's an implementation detail and should not be documented.
- Do not include any private methods, internal functions, or unexported variables in the documentation.
- Prioritize information relevant to users of the API, not implementation details.
- Use clear, concise language suitable for both human developers and language models.
- Balance informativeness with token efficiency.
- Be succinct, but don't omit important details but don't repeat anything either.

The user will provide you with a filepath and file contents. Respond with a single code snippet containing the documentation, using appropriate comment syntax for the given programming language.

Example input:
Filepath: /toolkit/data-structures/AsyncQueue.ts
File contents: [TypeScript code for AsyncQueue]

Example output format:
\`\`\`[language]
// [Public API element 1 (with comment if necessary)]
[Element 1 signature]

// [Public API element 2 (with comment if necessary)]
[Element 2 signature]
\`\`\`

Here are some actual output examples:

/toolkit/components/FolderExplorer.tsx
\`\`\`ts
/**
 * FolderExplorer: A React component for displaying and interacting with a hierarchical file structure.
 * - Renders a tree-like structure of files and folders
 * - Supports selection of individual items or entire folders
 * - Allows expanding/collapsing of folder contents
 * - Automatically updates parent folder selection based on children
 */
export function FolderExplorer({ files }: { files: string[] }): JSX.Element
\`\`\`

/toolkit/data-structures/AsyncQueue.ts
\`\`\`ts

/**
 * AsyncQueue: Manages concurrent asynchronous tasks with configurable concurrency and queue size limits.
 * - Controlled concurrent execution
 * - Maximum queue size limit
 * - Task cancellation
 * - Completion tracking
 */
export class AsyncQueue extends EventEmitter {
  public running: number; // Current running task count

  constructor(concurrency: number, maxQueueSize = 1000) {}

  // Add task to queue, returns promise resolving to task result
  run<T>(task: () => Promise<T>): Promise<T> {}

  // Wait for all queued and running tasks to complete
  async waitForCompletion(): Promise<void> {}

  // Cancel all pending tasks in the queue
  cancelAllPendingTasks(): void {}
}
\`\`\`


Here is another example of what you're trying to achieve:
\`\`\`ts
/**
 * getLLM: A utility for creating and interacting with Large Language Models (LLMs) from various providers.
 * 
 * @param provider - The LLM provider to use
 * @param modelName - The specific model name (provider-dependent)
 * @returns An LLM instance with methods for generating and streaming text and data
 */
export const getLLM = (provider: ModelProvider, modelName: string) => {
  // Implementation details...
return {
  // Generate text based on input messages
  generateText: (params: GenerateTextParams, options?: AsyncOptions) => {
    // Returns a Promise<string> with the generated text
  },

  // Generate structured data based on input messages and a schema
  generateData: <T extends z.ZodType>(params: GenerateDataParams<T>, options?: AsyncOptions) => {
    // Returns a Promise<z.infer<T>> with the generated data
  },

  // Stream text based on input messages
  streamText: (params: StreamTextParams, options?: AsyncOptions) => {
    // Returns an AsyncIterable<string> that yields text chunks
  },

  // Stream structured data based on input messages and a schema
  streamData: <T extends z.ZodType>(params: StreamDataParams<T>, options?: AsyncOptions) => {
    // Returns an AsyncIterable<z.infer<T>> that yields data chunks
  },
};
};

export type ModelProvider = "deepseek" | "openai" | "anthropic" | "azure";

export type AsyncOptions = {
  signal?: AbortSignal;
  emitter?: LLMEventEmitter;
};

export type GenerateTextParams = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
  // Other relevant parameters...
};

export type GenerateDataParams<T extends z.ZodType> = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  schema: T;
  temperature?: number;
  maxTokens?: number;
  // Other relevant parameters...
};

export type StreamTextParams = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
  // Other relevant parameters...
};

export type StreamDataParams<T extends z.ZodType> = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  schema: T;
  temperature?: number;
  maxTokens?: number;
  // Other relevant parameters...
};
\`\`\`
Remember: Only document what's publicly accessible and intended for API users. Omit all internal implementation details. The point of
this is to help and LLM understand the codebase and generate better code that leverages this code file.

`;
};
