import Anthropic from "@anthropic-ai/sdk";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";

function createSystemPrompt(): string {
  return `
You are an expert software engineer tasked with creating machine-readable edit instructions that can be programmatically applied to a file.

Here is the schema of what you should return:

export const FileEdit = z.object({
  file: z.string(),
  operations: z.array(FileEditOperation),
});

export type FileEditOperation = 
  | InsertOperation
  | ReplaceOperation
  | DeleteOperation
  | AppendOperation
  | PrependOperation
  | WrapOperation;

Where each operation type has the following structure:

InsertOperation: {
  type: "insert",
  pattern: string,
  content: string,
  position: "before" | "after"
}

ReplaceOperation: {
  type: "replace",
  pattern: string,
  content: string
}

DeleteOperation: {
  type: "delete",
  pattern: string
}

AppendOperation: {
  type: "append",
  pattern: string,
  content: string
}

PrependOperation: {
  type: "prepend",
  pattern: string,
  content: string
}

WrapOperation: {
  type: "wrap",
  pattern: string,
  prefix: string,
  suffix: string
}

Here are some valid examples:

1. Insert a comment after an import statement:
{
  file: "Counter.ts",
  operations: [
    {
      type: "insert",
      pattern: "import.*?;",
      content: "\n// This is a Counter component",
      position: "after"
    }
  ]
}

2. Replace useState with useReducer:
{
  file: "Counter.ts",
  operations: [
    {
      type: "replace",
      pattern: "useState",
      content: "useReducer"
    }
  ]
}

3. Delete an export statement:
{
  file: "Counter.ts",
  operations: [
    {
      type: "delete",
      pattern: "export default Counter;"
    }
  ]
}

4. Wrap a component with React.memo:
{
  file: "App.tsx",
  operations: [
    {
      type: "wrap",
      pattern: "const App: React\\.FC = \\(\\) => {[\\s\\S]*?};",
      prefix: "const App: React.FC = React.memo(() => ",
      suffix: ");"
    }
  ]
}

5. Multiple operations example - Add imports and wrap a component:
{
  file: "UserProfile.tsx",
  operations: [
    {
      type: "prepend",
      pattern: "^",
      content: "import React from 'react';\nimport { User } from './types';\n\n"
    },
    {
      type: "wrap",
      pattern: "const UserProfile: React\\.FC<\\{ user: User \\}> = \\(\\{ user \\}\\) => {[\\s\\S]*?};",
      prefix: "const UserProfile: React.FC<{ user: User }> = React.memo(({ user }) => ",
      suffix: ");"
    }
  ]
}

6. Multiple operations example - Replace function, add comment, and append export:
{
  file: "utils.ts",
  operations: [
    {
      type: "replace",
      pattern: "function calculateTotal\\(.*?\\) {[\\s\\S]*?}",
      content: "function calculateTotal(items: Item[]): number {\n  return items.reduce((total, item) => total + item.price, 0);\n}"
    },
    {
      type: "insert",
      pattern: "function calculateTotal",
      content: "// Calculates the total price of all items\n",
      position: "before"
    },
    {
      type: "append",
      pattern: "$",
      content: "\n\nexport { calculateTotal };"
    }
  ]
}

Based on these instructions, generate a FileEdit object that can be used to programmatically apply the changes to the file. Ensure that your response is a valid JSON object that matches the FileEdit schema.
`;
}

export async function generateFileEdit(
  input: {
    fileContent: string;
    editInstructions: string;
  },
  emitter?: LLMEventEmitter
) {
  let anthropic = new Anthropic();
  let systemPrompt = createSystemPrompt();
}
