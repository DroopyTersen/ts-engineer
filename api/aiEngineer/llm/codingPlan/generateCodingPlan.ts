import { createReadFilesTool } from "api/aiEngineer/tools/readFiles.tool";
import { createSearchCodeSnippetsTool } from "api/aiEngineer/tools/searchCodeSnippets.tool";
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
    codeTask.previousPlan && codeTask.followUpInput
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
  - If there are other changes (that aren't described) that need to be made to satisfy the requirements, implement them as well.

Here is the coding task to implement:

`;
  emitter?.emit("content", CURSOR_PREFIX);

  const specificationRegex = /<specifications>([\s\S]*?)<\/specifications>/;
  const match = codeTask.specifications.match(specificationRegex);
  const formattedSpecifications = match ? match[1].trim() : "";

  emitter?.emit("content", `${formattedSpecifications}\n\n`);

  const result = await llm.runTools(
    {
      label: "generateCodingPlan",
      maxTokens: 8000,
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

  let finalPlan = result.text.trim();
  // Extract the coding plan from the result
  const codingPlanRegex = /<coding_plan>([\s\S]*?)<\/coding_plan>/;
  const codingPlanMatch = result.text.match(codingPlanRegex);
  finalPlan = codingPlanMatch ? codingPlanMatch[1].trim() : finalPlan;

  return CURSOR_PREFIX + finalPlan;
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

3. Read file contents: If any of the relevant files have not been provided already in the <file_contents>, Use the \`readFileContents\` tool to read the contents of the missing file. Pass an array of filepaths to this tool.

4. Search for relevant code: After reading some files, if you have further questions about the codebase, use the \`searchCodeSnippets\` tool to find relevant code snippets related to the task. This can help you identify other files you may want to call readFileContents on. This can help you identify affected areas, understand current implementations, or find usage patterns. Use specific function names, variable names, or unique strings to narrow down your search.

5. Process information: Analyze the contents of the identified files and extracted code snippets, and extract key information relevant to the task and follow-up input.

6. Detailed File Changes:
  - Responde with a File Changes sections, where for each affected file:
  - Provide code snippets illustrating changes as suggested diffs, matching existing style. Only include small snippets surrounding the changes, not the full file contents. If there are multiple changes to a file, provide separate snippets for each change within the same File Change entry.
  - Include clear, step-by-step instructions that could be followed by a developer.
  - If a file doesn't need to be changed, leave it out of the File Changes section. If it's important to the task, you can mention it in the Additional Notes section.
</process>


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
<draft>
[First in a <draft> tag, provide bulleted list of the files that need to be updated, created, deleted, or moved and a concise description of the changes that need to be made. This is a first draft and will need to be updated.]
</draft>

<thought>
[Review the high level overview and the files that need to be updated in <thought> tags. Are there any considerations or concerns? Are there other files that may need to be updated to complete the task? We need to make sure to be exhaustive with our change plan. Don't be lazy! The feature should be fully implemented once this plan is complete. Leave no stone unturned. We need to think very critically about the draft plan and make sure the feature will work, and we haven't missed anything. It might even make sense to look at the file content of another file.]
</thought>

<coding_plan>
# Technical Design
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

Ensure your response follows this structure and provides clear, actionable instructions for each file change. Maintain consistency with the existing codebase and adhere to best practices. It is important that you try to limit the length of your code snippets to just what the relevant parts surrounding the changes, and the changes themselves. Otherwise, the plan will be hard to digest for developers. Remember, each file should only appear once in the File Changes section, with all necessary changes for that file grouped together.`;
};
