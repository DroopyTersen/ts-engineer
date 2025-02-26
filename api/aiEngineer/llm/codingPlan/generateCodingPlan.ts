import { createReadFilesTool } from "api/aiEngineer/tools/readFiles.tool";
import { createSearchCodeSnippetsTool } from "api/aiEngineer/tools/searchCodeSnippets.tool";
import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { createCachedProjectMessageTextContents } from "../specfications/generateSpecifications";

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
    previousPlan?: string;
    followUpInput?: string;
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
    ...createCachedProjectMessageTextContents(projectContext),
    codeTask.previousPlan && codeTask.followUpInput
      ? {
          type: "text",
          text: `Please update the previous_plan according to the follow_up_input instructions. You need to rewrite the entire previous plan but adjusted to match the follow_up_input instructions. Generate the new plan entirely! Don't be lazy!
    
    <previous_plan>${codeTask.previousPlan}</previous_plan>\n\n
    
    
    <follow_up_input>${codeTask.followUpInput}. Generate the updated plan entirely! Don't be lazy!</follow_up_input>

It is VERY IMPORTANT that you update the entire previous plan. Don't be lazy! Generate the whole enitre plan again but adjusted to match the follow_up_input instructions.
`,
        }
      : {
          type: "text",
          text: `<raw_input>${codeTask.rawInput}</raw_input>\n<specifications>${codeTask.specifications}</specifications>`,
        },
    {
      type: "text",
      text: `IMPORTANT!! - Follow the <coding_plan> formatting template exactly!! It is critical to matched their desired formatting so things display well for users! Try not to waste tokens by re-reading files that are already provided in the <file_contents> section. Now please write the <coding_plan> section.`,
    },
  ];

  const specificationRegex = /<specifications>([\s\S]*?)<\/specifications>/;
  const match = codeTask.specifications.match(specificationRegex);
  const formattedSpecifications = match ? match[1].trim() : "";

  emitter?.emit("content", `${formattedSpecifications}\n\n`);

  const result = await llm.streamText(
    {
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 2000 },
        },
      },
      maxSteps: 20,
      label: "generateCodingPlan",
      maxTokens: 8000,
      temperature: 0.1,
      startSequence: "<coding_plan>",
      stopSequences: ["</coding_plan>"],
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

  let finalPlan = result.text.trim();
  // Extract the coding plan from the result
  const codingPlanRegex = /<coding_plan>([\s\S]*?)<\/coding_plan>/;
  const codingPlanMatch = result.text.match(codingPlanRegex);
  finalPlan = codingPlanMatch ? codingPlanMatch[1].trim() : finalPlan;

  return finalPlan;
};

const createSystemPrompt = () => {
  return `You are an expert software engineer tasked with creating a detailed coding plan based on provided specifications and follow-up input (if any). Your plan should be clear, concise, and actionable for a junior developer to implement the required changes accurately. Follow these guidelines:

For each step of in the process, explain your thought process:
- Why you're making specific decisions
- How these decisions relate to the overall task and follow-up input
- Any trade-offs or alternatives you considered
- Put these thoughts in <thought> tags.

<process>
1. Analyze the task: Carefully review the provided information, task description, and follow-up input (if present).

2. Identify relevant files: Based on the task and follow-up input, think about which files in the <file_structure> might be relevant. List these files and explain why they're important. They might be files that need to be updated, they might be files that are an example of what you're looking for, or they might be files that are a good reference for the coding style. This step is critical to your success. You must properly identify relevant files so that you ensure you are making the correct changes, in the correct places, with an approach and style that matches the rest of the codebase.

3. Read file contents: If any of the relevant files have not been provided already in the <file_contents>, Use the \`readFileContents\` tool to read the contents of the missing file. Pass an array of filepaths to this tool.  IMPORTANT! - First check to see if the file was already provided in the <file_contents>. If it was you probably don't need to call the tool unless the contents were cutoff.

4. Search for relevant code: After reading some files, if you have further questions about the codebase, use the \`searchCodeSnippets\` tool to find relevant code snippets related to the task. This can help you identify other files you may want to call readFileContents on. This can help you identify affected areas, understand current implementations, or find usage patterns. Use specific function names, variable names, or unique strings to narrow down your search. You only need to call this tool if the provided <file_contents> doesn't have the information you need.

5. Process information: Analyze the contents of the identified files and extracted code snippets, and extract key information relevant to the task and follow-up input.

6. Detailed File Changes:
  - Respond with a File Changes sections, where for each affected file:
  - Provide code snippets illustrating changes as suggested diffs, matching existing style. Only include small snippets surrounding the changes, not the full file contents. If there are multiple changes to a file, provide separate snippets for each change within the same File Change entry.
  - Include clear, step-by-step instructions that could be followed by a developer.
  - If a file doesn't need to be changed, leave it out of the File Changes section. If it's important to the task, you can mention it in the Additional Notes section.
  - A file should only appear once in the File Changes section.
  - Try to order things in a way that makes sense. Which changes would a developer make first?
</process>

<tool_usage_guidelines>
Remember, you can call \`readFileContents\` and \`searchCodeSnippets\` multiple times in your process. It is important to review the relevant and pertinent files in the codebase to understand how to best define the specifications for the coding task. It would be strange to call getFileContents though on a file that was already provided in the <file_contents> section.
</tool_usage_guidelines>

<guidelines>
Consistency and Best Practices:
   - Ensure changes adhere to project's coding standards and best practices based on the provided existing file contents.
   - Maintain consistency in naming conventions, code structure, and design patterns.

Grouping Changes by File:
   - Ensure that all changes for a specific file are grouped under a single File Change entry.
   - The same file path should not appear multiple times in the File Changes list.
   - Each File Change entry should encompass all necessary modifications for that file.

Code Snippet Generation Rules:
   - Only include small snippets surrounding the changes, not the full file contents.
   - Use '// [!code --]' at the end of lines to be removed and '// [!code ++]' at the end of lines to be added.
   - This format applies to all languages, including JSX/TSX. Do not use {/* [!code ++] */} or similar formats for JSX/TSX/html.
   - For multi-line additions or removals in JSX/TSX, add the comment to the end of each line individually.
   - Include minimal surrounding context to help locate the changes in the file.
   - Follow the 
   - Do NOT include large blocks of unchanged code.
   Example of correct way to present changes:
   
   \`\`\`jsx
   <MarkdownTextarea
     // ... existing props
   />
   <div className="mt-4"> // [!code ++]
     <Label htmlFor="maxFileContentTokens">Max File Content Tokens</Label> // [!code ++]
     <input // [!code ++]
       type="number" // [!code ++]
       id="maxFileContentTokens" // [!code ++]
       name="maxFileContentTokens" // [!code ++]
       defaultValue={50000} // [!code ++]
       // ... other props // [!code ++]
     /> // [!code ++]
   </div> // [!code ++]
   \`\`\`
</guidelines>


Use the following format for your response:
<coding_plan>
[Concise overview of the task, objectives, and high-level decisions, including how the follow-up input (if any) affects the plan.]

[Provide a final list of files that need to be updated, created, deleted, or moved, and a concise description of the changes that need to be made to that file. This is the final plan.]

## File Changes

### 1. FILE: [File Path]
- ACTION: [Update/Create/Move/Delete]
- DESCRIPTION: [Detailed description of all changes required for this file, including how they address the follow-up input if applicable]

\`\`\`[language]
// Existing code...
console.log('This line will be removed') // [!code --]
console.log('This line will be added') // [!code ++]
// Existing code...
\`\`\`

- Instructions for developer:
  1. [Step-by-step instructions for all changes in this file]
  2. [Necessary context or explanations]
  3. [Potential pitfalls or areas needing careful attention]

- Reasoning:
  [Explain your thought process for these changes, including how they address the follow-up input if applicable]

### 2. FILE: [File Path]
...

</coding_plan>

IMPORTANT!! - Follow the <coding_plan> formatting template exactly!! It is critical to matched their desired formatting so things display well for users! 



IMPORTANT!! - YOU SHOULD NEVER call read_file_contents on a file that was already provided in the <file_contents> section. Reference it from <file_contents> section. don't waste tokens on extra tool calls!

Ensure your response follows this structure and provides clear, actionable instructions for each file change. Maintain consistency with the existing codebase and adhere to best practices. It is important that you try to limit the length of your code snippets to just what the relevant parts surrounding the changes, and the changes themselves. Otherwise, the plan will be hard to digest for developers. Remember, each file should only appear once in the File Changes section, with all necessary changes for that file grouped together.`;
};
