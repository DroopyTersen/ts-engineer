import OpenAI from "openai";
import { getCachedMessageContent, LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
type GenerateCodingPlanInput = {
  projectContext: {
    absolutePath: string;
    title: string;
    summary?: string;
    fileStructure: string;
    fileContents: string[];
  };
  codeTask: {
    specifications: string;
    rawInput: string;
  };
};

type GenerateRevisedCodingPlanInput = {
  projectContext: {
    absolutePath: string;
    title: string;
    summary?: string;
    fileStructure: string;
    fileContents: string[];
  };
  codeTask: {
    specifications: string;
    previousPlan: string;
    followUpInput: string;
  };
};

export const generateCodingPlanWithReasoning = async (
  {
    projectContext,
    codeTask,
  }: GenerateCodingPlanInput | GenerateRevisedCodingPlanInput,
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const systemPrompt = createSystemPrompt();

  let userMessageTextContents = [
    getCachedMessageContent(
      `<summary>${projectContext.summary || "No summary provided"}</summary>`
    ),
    getCachedMessageContent(
      `<file_structure>${projectContext.fileStructure}</file_structure>`
    ),
    getCachedMessageContent(
      `<file_contents>${projectContext.fileContents.join(
        "\n\n"
      )}</file_contents>`
    ),
    "previousPlan" in codeTask
      ? {
          type: "text",
          text: `Please update the previous_plan according to the follow_up_input instructions. Generate the new plan entirely! Don't be lazy!
    
    <previous_plan>${codeTask.previousPlan}</previous_plan>\n\n
    
    
    <follow_up_input>${codeTask.followUpInput}. Generate the updated plan entirely! Don't be lazy!</follow_up_input>`,
        }
      : {
          type: "text",
          text: `<raw_input>${codeTask.rawInput}</raw_input>\n<specifications>${codeTask.specifications}</specifications>`,
        },
  ];
  const CURSOR_PREFIX = `Given the following coding tasks specifcations and technical design, identify any files mentioned and then add them into context. 
  
  - If there are other relevant files, add them into context as well.Then use the suggested FileChanges section to implement the specified changes. 
  - When implmenting the suggested changes, do no rewrite the whole file, only update what needs to up updated. 
  - If you see a comment like "// ...existing code", that means you should leave the code as it was. DON'T update the code to add that comment. 
  - Dont be lazy!!! Implement the entire change. And every change!! There will be a numbered list of "File Changes". For each file you have changes to apply!
  - If there are other changes (that aren't described) that need to be made to satisfy the requirements, implement them as well.

Here is the coding task to implement:

`;
  emitter?.emit("content", CURSOR_PREFIX);

  const specificationRegex = /<specifications>([\s\S]*?)<\/specifications>/;
  const match = codeTask.specifications.match(specificationRegex);
  const formattedSpecifications = match ? match[1].trim() : "";

  emitter?.emit("content", `${formattedSpecifications}\n\n`);

  let openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  let completion = await openai.chat.completions.create({
    model: "o1-mini",
    messages: [
      { role: "user", content: systemPrompt },
      { role: "user", content: userMessageTextContents as any },
    ],
  });
  console.log("🚀 | completion:", completion);
  let resultText = completion.choices[0].message.content + "";
  emitter?.emit("content", resultText);
  return CURSOR_PREFIX + resultText.trim();
};
const createSystemPrompt = () => {
  return `You are an expert software engineer tasked with creating a detailed coding plan based on provided specifications and follow-up input (if any). Your coding plan should be clear, concise, and actionable for a developer to implement the required changes accurately. Follow these guidelines:

1. Analyze the task: Carefully review the provided information, task description, and follow-up input (if present).
2. Process information: Analyze the contents of the identified files and extracted code snippets, and extract key information relevant to the task and follow-up input.
3. Detailed File Changes - the coding plan should be broken down by file. For each affected file:
   a. Specify exact changes required, including line numbers when applicable.
   b. Provide code snippets illustrating changes, matching existing style. **Only include small snippets surrounding the changes, not the full file contents.** If there are multiple changes to a file, provide separate snippets for each change.
   c. Include clear, step-by-step instructions that could be followed by a developer.
   d. If a file doesn't need to be changed, leave it out of the File Changes section. If it's important to the task, you can mention it in the Additional Notes section.
4. Consistency and Best Practices:
   - Ensure changes adhere to project's coding standards and best practices based on the provided existing file contents.
   - Maintain consistency in naming conventions, code structure, and design patterns.
5. Respond as if you are talking to a developer. Be detailed, precise and specific, but also concise.
6. Formatting
   - Make sure all code blocks are surrounded by \`\`\`[language] tags and then have empty lines before and after the code block.

Response Format:
## Plan
[Concise overview of the task, objectives, and high-level decisions. One or two sentences at most.]

[Provide a numbered list of files that need to be updated, created, deleted, or moved, and a concise description of the changes that need to be made. We need to make sure to be exhaustive with our change plan. Don't be lazy! The feature should be fully implemented once this plan is complete. Leave no stone unturned. If a file doesn't need to be changed, leave it out of the File Changes section.]

## File Changes

### 1. FILE: [File Path]
- ACTION: [Update/Create/Move/Delete]
- DESCRIPTION: [Detailed description of changes, including how they address the follow-up input if applicable]

\`\`\`[language]
[Code snippet showing changes, matching existing style. **Only include a small snippet surrounding the changes, not the entire file.**]
\`\`\`

- Instructions for developer:
  1. [Step-by-step instructions]
  2. [Necessary context or explanations]
  3. [Potential pitfalls or areas needing careful attention]

- Reasoning:
  [Explain your thought process for these changes, including how they address the follow-up input if applicable]

### 2. FILE: [File Path]
...

## Additional Notes
[Any extra information, considerations, or resources. Don't mention preachy things warning about code quality, testing or performance unless you are asked about it. Stick to the task at hand.]

Ensure your response follows this structure and provides clear, actionable instructions for each file change. Maintain consistency with the existing codebase and adhere to best practices. It is important that you try to limit the length of your code snippets to just what the relevant parts surrounding the changes, and the changes themselves. Otherwise the plan will be hard to digest for developers.`;
};
