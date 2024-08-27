import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { LLM } from "~/toolkit/ai/vercel/getLLM";

const CodeTaskTypeSchema = z.enum([
  "bugFix",
  "newFeature",
  "refactor",
  "documentation",
]);

export type CodeTaskType = z.infer<typeof CodeTaskTypeSchema>;

export const classifyCodeTask = async (
  taskDescription: string,
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const systemPrompt = createSystemPrompt();
  const userPrompt = taskDescription.trim();

  const result = await llm.streamText(
    {
      maxTokens: 10,
      temperature: 0,
      system: systemPrompt,
      prompt: userPrompt,
    },
    {
      emitter,
    }
  );

  const classification = result.text.trim();
  return CodeTaskTypeSchema.parse(classification);
};

const createSystemPrompt = () => {
  return `You are tasked with classifying a coding task into one of four categories: bugFix, newFeature, refactor, or documentation. The user will provide a description of a coding task, and you must determine which category it falls into based on the following examples:

Examples:
1. bugFix:
   - "Fix the login button that's not responding when clicked"
   - "Resolve the issue where the app crashes when uploading large files"

2. newFeature:
   - "Add a dark mode option to the user interface"
   - "Implement a search functionality for the product catalog"

3. refactor:
   - "Optimize the database queries to improve performance"
   - "Reorganize the codebase to follow the MVC pattern"

4. documentation:
   - "Write API documentation for the new endpoints"
   - "Create a user guide for the admin dashboard"

Respond with ONLY the classification, without any additional explanation or text.

When the User gives you a coding task your response should be one of these four words: bugFix, newFeature, refactor, or documentation.`;
};
