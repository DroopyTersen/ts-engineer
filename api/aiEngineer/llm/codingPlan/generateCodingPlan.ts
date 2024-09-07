import { createReadFilesTool } from "api/aiEngineer/tools/readFiles.tool";
import { createSearchCodeSnippetsTool } from "api/aiEngineer/tools/searchCodeSnippets.tool";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getCachedMessageContent, LLM } from "~/toolkit/ai/vercel/getLLM";

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

export const generateCodingPlan = async (
  { projectContext, codeTask }: GenerateCodingPlanInput,
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
    {
      type: "text",
      text: `<raw_input>${codeTask.rawInput}</raw_input>\n<specifications>${codeTask.specifications}</specifications>`,
    },
  ];
  const CURSOR_PREFIX = `Given the following coding tasks specifcations and technical design, identify any files mentioned and then add them into context. 
  
  - If there are other relevant files, add them into context as well.Then use the suggested FileChanges section to implement the specified changes. 
  - When implmenting the suggested changes, do no rewrite the whole file, only update what needs to up updated. 
  - If you see a comment like "// ...existing code", that means you should leave the code as it was. DON'T update the code to add that comment. 
  - If there are other changes that need to be made to satisfy the requirements, please implement them as well.

Here is the coding task to implement:

`;
  emitter?.emit("content", CURSOR_PREFIX);
  // Extract formatted specifications from codeTask.specifications
  const specificationRegex = /<specifications>([\s\S]*?)<\/specifications>/;
  const match = codeTask.specifications.match(specificationRegex);
  const formattedSpecifications = match ? match[1].trim() : "";

  emitter?.emit("content", `${formattedSpecifications}\n\n`);

  const result = await llm.runTools(
    {
      label: "generateCodingPlan",
      maxTokens: 4000,
      temperature: 0.1,
      tools: {
        readFileContents: createReadFilesTool(projectContext.absolutePath),
        searchCodeSnippets: createSearchCodeSnippetsTool(
          projectContext.absolutePath
        ),
      },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userMessageTextContents as any,
        },
      ],
    },
    {
      emitter,
    }
  );

  return CURSOR_PREFIX + result.text.trim();
};
const createSystemPrompt = () => {
  return `You are an expert software engineer tasked with creating a detailed coding plan based on provided specifications. Your plan should be clear, concise, and actionable for a junior developer to implement the required changes accurately. Follow these guidelines:

1. Analyze the task: Carefully review the provided information and task description.

2. Identify relevant files: Based on the task, think about which files in the <file_structure> might be relevant. List these files and explain why they're important. They might be files that need to be updated, they might be files that are an example of what you're looking for, or they might be files that are a good reference for the coding style. This step is critical to your success. You must properly identify relevant files so that you ensure you are making the correct changes, in the correct places, with an approach and style that matches the rest of the codebase.

3. Read file contents: If any of the relevant files have not been provided already in the <file_contents>, Use the \`readFileContents\` tool to read the contents of the missing file. Pass an array of filepaths to this tool.

4. Search for relevant code: After reading some files, if you have further questions about the codebase, use the \`searchCodeSnippets\` tool to find relevant code snippets related to the task. This can help you identify other files you may want to call readFileContents on. This can help you identify affected areas, understand current implementations, or find usage patterns. Use specific function names, variable names, or unique strings to narrow down your search.

5. Process information: Analyze the contents of the identified files and extracted code snippets, and extract key information relevant to the task.

6. Detailed File Changes:
   For each affected file:
   a. Specify exact changes required, including line numbers when applicable.
   b. Provide code snippets illustrating changes, matching existing style.
   c. Include clear, step-by-step instructions that could be followed by a junior developer.

7. Consistency and Best Practices:
   - Ensure changes adhere to project's coding standards and best practices.
   - Maintain consistency in naming conventions, code structure, and design patterns.

Chain of Thought Reasoning:
For each step of your plan, explain your thought process:
- Why you're making specific decisions
- How these decisions relate to the overall task
- Any trade-offs or alternatives you considered

Response Format:
# Technical Design

[First provide your thought process in <thought> tags. In <thought> tags, provide your reasoning for why you are searching for specific code snippets or reading certain files, what you are looking for, and any key insights you have gained.]

## Overview
[Concise overview of the task, objectives, and high-level decisions. Give a quick bulleted list of the files that need to be updated, created, deleted, or moved.]

## File Changes

### 1. FILE: [File Path]
- ACTION: [Update/Create/Move/Delete]
- DESCRIPTION: [Detailed description of changes]

\`\`\`[language]
[Code snippet showing changes, matching existing style]
\`\`\`

- Instructions for junior developer:
  1. [Step-by-step instructions]
  2. [Necessary context or explanations]
  3. [Potential pitfalls or areas needing careful attention]

- Reasoning:
  [Explain your thought process for these changes]

### 2. FILE: [File Path]
...

## Additional Notes
[Any extra information, considerations, or resources]

Ensure your response follows this structure and provides clear, actionable instructions for each file change. Maintain consistency with the existing codebase and adhere to best practices.`;
};
