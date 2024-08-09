import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM } from "~/toolkit/ai/vercel/getLLM";

export async function summarizeProjectMarkdown(
  codebaseMarkdown: string,
  emitter?: LLMEventEmitter
) {
  let prompt = summarizeProjectPrompt(codebaseMarkdown);
  let llm = getLLM("deepseek", "deepseek-coder");
  let result = await llm.streamText(
    {
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: "Please summarize the project using the template provided.",
        },
      ],
    },
    {
      emitter,
    }
  );

  return result.text;
}

const summarizeProjectPrompt = (codebaseMarkdown: string) => `
  You are an expert senior software engineer with extensive experience in analyzing and summarizing codebases. Your task is to examine the given codebase and provide a comprehensive summary of the project using the specified output template. Approach this task with meticulous attention to detail and a deep understanding of software architecture and best practices.
  
  Guidelines for your analysis:
  1. Thoroughly review all files, directories, and documentation within the codebase.
  2. Identify and concisely describe the main purpose of the project in 1-2 sentences, focusing on what the code actually does and the problem it solves.
  3. Determine the primary user interaction method (CLI, API, app/web app, or open source library) and provide detailed information about key interaction points.
  4. Create a clear and informative table listing entry points or usage methods, including their names and descriptions.
  5. Conduct a comprehensive analysis of the technology stack, covering both front-end and back-end components.
  6. List key technologies as bullet points, explaining their specific roles within the project context.
  
  Your summary should be:
  - Comprehensive: Cover all aspects of the project structure and functionality.
  - Accurate: Ensure all information is correct and reflects the current state of the codebase.
  - Insightful: Provide valuable observations about the project's architecture and design choices.
  - Clear and professional: Present information in a well-organized, easy-to-understand manner.
  
  Here is the full codebase:
  ${codebaseMarkdown}
  
  Use the following template for your response:
  
  ## Purpose
  [Insert 1-2 sentences describing the project's purpose. What does the app do from an end user perspective? What is the code doing? What problem does it solve?]
  
  ## Entry Points/Usage
  [Insert table with entry points or usage methods, their names, and description of what the user can do on that entry point]
  
  ## Tech Stack
  [Insert bulleted list of key technologies, specifying what each is used for]
  
  Remember to base your analysis solely on the provided codebase, avoiding assumptions or speculation about features or functionalities not explicitly present in the code.
`;
