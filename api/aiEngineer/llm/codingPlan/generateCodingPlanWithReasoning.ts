import OpenAI from "openai";
import { getCachedMessageContent, LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";

export const generateCodingPlanWithReasoning = async (
  {
    projectContext,
    codeTask,
    followUpInput, // Added optional followUpInput
    previousPlan, // Added optional previousPlan
  }: {
    projectContext: {
      absolutePath: string;
      title: string;
      summary?: string;
      fileStructure: string;
      fileContents: string[];
    };
    codeTask: {
      specifications: string;
      rawInput?: string;
    };
    followUpInput?: string; // Optional followUpInput
    previousPlan?: string; // Optional previousPlan
  },
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const systemPrompt = createSystemPrompt();

  // Initialize userMessageTextContents with project context
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
    // Conditionally add code task based on presence of previousPlan and followUpInput
    previousPlan && followUpInput
      ? {
          type: "text",
          text: `Please update the previous_plan according to the follow_up_input instructions. Generate the new plan entirely! Don't be lazy!
  
  <previous_plan>${previousPlan}</previous_plan>\n\n
  
  
  <follow_up_input>${followUpInput}. Generate the updated plan entirely! Don't be lazy!</follow_up_input>`,
        }
      : {
          type: "text",
          text: `<raw_input>${
            codeTask.rawInput || ""
          }</raw_input>\n<specifications>${
            codeTask.specifications
          }</specifications>`,
        },
  ];

  const CURSOR_PREFIX = `Given the following coding tasks specifications and technical design, identify any files mentioned and then add them into context. 

  - If there are other relevant files, add them into context as well. Then use the suggested FileChanges section to implement the specified changes. 
  - When implementing the suggested changes, do not rewrite the whole file, only update what needs to be updated. 
  - If you see a comment like "// ...existing code", that means you should leave the code as it was. DON'T update the code to add that comment. 
  - Don't be lazy!!! Implement the entire change. And every change!! There will be a numbered list of "File Changes". For each file you have changes to apply!
  - If there are other changes (that aren't described) that need to be made to satisfy the requirements, implement them as well.
  - Pay attention to the diff syntax in code snippets:
    - Lines ending with '// [!code --]' should be removed.
    - Lines ending with '// [!code ++]' should be added.
    - Do NOT include these comments in your actual code changes. They are only there to guide you on what to modify.
  - When making changes, apply the additions and removals as indicated by the diff syntax, but do not include the '// [!code --]' or '// [!code ++]' comments in your final code.

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
  try {
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
  } catch (err: any) {
    console.error("🚀 | generateCodingPlanWithReasoning | err:", err);
    return "An error occurred while generating the coding plan." + err?.message;
  }
};

const createSystemPrompt = () => {
  return `You are an expert software engineer tasked with creating a detailed coding plan based on provided specifications and follow-up input (if any). Your coding plan should be clear, concise, and actionable for a developer to implement the required changes accurately. Follow these guidelines:

1. Analyze the task: Carefully review the provided information, task description, and follow-up input (if present).
2. Process information: Analyze the contents of the identified files and extracted code snippets, and extract key information relevant to the task and follow-up input.
3. **Grouping Changes by File**:
   - **Ensure that all changes for a specific file are grouped under a single File Change entry.**
   - **The same file path should not appear multiple times in the File Changes list.**
   - **Each File Change entry should encompass all necessary modifications for that file.**
4. Detailed File Changes - the coding plan should be broken down by file. For each affected file:
   a. Specify exact changes required, including line numbers when applicable.
   b. Provide code snippets illustrating changes as suggested diffs, matching existing style. **Only include small snippets surrounding the changes, not the full file contents.** If there are multiple changes to a file, provide separate snippets for each change within the same File Change entry.
   c. Include clear, step-by-step instructions that could be followed by a developer.
   d. If a file doesn't need to be changed, leave it out of the File Changes section. If it's important to the task, you can mention it in the Additional Notes section.
5. Consistency and Best Practices:
   - Ensure changes adhere to project's coding standards and best practices based on the provided existing file contents.
   - Maintain consistency in naming conventions, code structure, and design patterns.
6. Respond as if you are talking to a developer. Be detailed, precise and specific, but also concise.
7. Code Snippet Generation Rules:
   - Only include small snippets surrounding the changes, not the full file contents.
   - Use '// [!code --]' at the end of lines to be removed and '// [!code ++]' at the end of lines to be added.
   - This format applies to all languages, including JSX/TSX. Do not use {/* [!code ++] */} or similar formats for JSX/TSX/html.
   - For multi-line additions or removals in JSX/TSX, add the comment to the end of each line individually.
   - Include minimal surrounding context to help locate the changes in the file.
   - Do NOT include large blocks of unchanged code.
   - Do NOT use inline comments for additions or removals.

Example of what NOT to do:

\`\`\`jsx
<MarkdownTextarea
  label="Code Task"
  value={value}
  onChanged={setValue}
  // ... other props
/>
{/* [!code ++] */}
<div className="mt-4">
  <Label htmlFor="maxFileContentTokens">Max File Content Tokens</Label>
  <input
    type="number"
    id="maxFileContentTokens"
    name="maxFileContentTokens"
    defaultValue={50000}
    // ... other props
  />
</div>
{/* [!code ++] */}
\`\`\`

Correct way to present the changes:

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

Response Format:

## Plan
[Concise overview of the task, objectives, and high-level decisions. One or two sentences at most.]

[Provide a numbered list of files that need to be updated, created, deleted, or moved, and a concise description of the changes that need to be made. We need to make sure to be exhaustive with our change plan. Don't be lazy! The feature should be fully implemented once this plan is complete. Leave no stone unturned. If a file doesn't need to be changed, leave it out of the File Changes section.]

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

## Additional Notes
[Any extra information, considerations, or resources. Don't mention preachy things, warning about code quality, testing, or performance unless you are asked about it. Stick to the task at hand.]

Ensure your response follows this structure and provides clear, actionable instructions for each file change. Maintain consistency with the existing codebase and adhere to best practices. It is important that you try to limit the length of your code snippets to just what the relevant parts surrounding the changes, and the changes themselves. Otherwise, the plan will be hard to digest for developers. Remember, each file should only appear once in the File Changes section, with all necessary changes for that file grouped together.`;
};
