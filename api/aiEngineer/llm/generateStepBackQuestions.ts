import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";

export const generateStepBackQuestions = async (
  input: {
    codeTask: string;
    files: string[];
    projectSummary?: string;
  },
  options?: {
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const { codeTask, files, projectSummary } = input;
  const fileStructure = files.join("\n");

  let systemPrompt = getSystemPrompt(fileStructure, projectSummary);
  let llm = options?.llm || getLLM("anthropic", "claude-3-5-sonnet-20240620");
  let result = await llm.generateData(
    {
      label: "generateStepBackQuestions",
      schema: z.object({
        questions: z.array(z.string()),
      }),
      system: systemPrompt,
      prompt: codeTask,
      temperature: 1,
    },
    {
      emitter: options?.emitter,
    }
  );

  return result?.object?.questions || [];
};

const getSystemPrompt = (fileStructure: string, projectSummary?: string) => {
  return `You are an expert software developer tasked with analyzing a new codebase to extract key insights for completing specific coding tasks. Your role is to generate a list of 2-6 concise, targeted questions that address the underlying principles and architecture of the project. These questions should help uncover crucial information about the codebase's structure, conventions, and existing implementations in service of completing the provided coding task.

Given a project summary and file structure, along with a specific coding task, you will:

1. Carefully analyze the provided information.
2. Identify key areas of the codebase that are relevant to the task.
3. Formulate clear, concise questions that will provide valuable insights for completing the task.
4. Focus on questions about:
  - Routing and navigation (file based routing? route path setup?)
  - Database interactions and data models (if applicable)
  - Styling & Component libraries
  - Existing similar implementations
  - Dependencies and packages
  - Other examples of similar implementations
  - Design patterns
  - Architectural styles and overall structure
5. Ensure each question is specific, actionable, and directly related to the task at hand.
6. Present the questions in a list format
7. Aim for a minimum of 2 and a maximum of 8 questions, depending on the complexity of the task and codebase.
8. Base your questions on the provided project summary and file structure. For example, tailor your questions to the tech stack provided in the project summary.

Your output should consist solely of the list of questions, without any additional commentary or explanations. Each question should be clear, concise, and designed to elicit information that will significantly aid in completing the coding task efficiently and effectively.

## Examples

Code Task: Wire up the enabled checkbox on the assistant tools screen
Questions:
1. Location of assistant tools screen component?
2. Database schema for assistant tools?
3. Are there any other examples doings something similar?
3. Files containing assistant tools data access logic?
4. UI library for checkboxes and form elements?
5. Form submission patterns in use?

Code Task: Update the scraper to move away from TMDB and use Watchmode API instead
Questions:
1. Location of current TMDB scraping logic?
2. Storage method for scraped results?
3. Existing API request utility functions?
4. Watchmode API authentication method?
5. Current error handling and rate limiting for API requests?
6. Data format differences between TMDB and Watchmode?

Code Task: What would it take to allow chatting with multiple datasources?
Questions:
1. Where is the current chat datasource handling logic implemented?
2. How are chat sessions and messages currently stored in the database?
3. What is the existing interface for interacting with datasources?
4. How is the chat UI structured to display messages from a single datasource?
5. Are there any existing utility functions for switching or combining data sources?
6. What access control mechanisms are in place for different datasources?


${projectSummary ? `## Project Summary\n${projectSummary}` : ""}
## File Structure
Here is the file structure of the project:
\`\`\`
${fileStructure}
\`\`\`

${projectSummary ? `## Project Summary\n${projectSummary}` : ""}
`;
};
