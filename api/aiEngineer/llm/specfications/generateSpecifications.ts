import { createReadFilesTool } from "api/aiEngineer/tools/readFiles.tool";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getCachedMessageContent, LLM } from "~/toolkit/ai/vercel/getLLM";
import { CodeTaskType } from "./classifyCodeTask";

type WriteSpecsInput = {
  projectContext: {
    absolutePath: string;
    title: string;
    summary?: string;
    fileStructure: string;
    fileContents: string[];
  };
  codeTask: {
    input: string;
    taskType: CodeTaskType;
    specifications?: string;
    followupInstructions?: string;
  };
};

export const createCachedProjectMessageTextContents = (projectContext: {
  title: string;
  summary?: string;
  fileStructure: string;
  fileContents: string[];
}) => {
  return [
    { type: "text", text: `<title>${projectContext.title}</title>` },
    projectContext.summary
      ? getCachedMessageContent(
          `<summary>${
            projectContext.summary || "No summary provided"
          }</summary>`
        )
      : null,
    getCachedMessageContent(
      `<file_structure>${projectContext.fileStructure}</file_structure>`
    ),
    getCachedMessageContent(
      `<file_contents>${projectContext.fileContents.join(
        "\n\n"
      )}</file_contents>`
    ),
  ].filter(Boolean) as { type: "text"; text: string }[];
};

export const generateSpecifications = async (
  { projectContext, codeTask }: WriteSpecsInput,
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const systemPrompt = createSystemPrompt(codeTask.taskType);

  let userMessageTextContents = createCachedProjectMessageTextContents({
    fileContents: projectContext.fileContents,
    fileStructure: projectContext.fileStructure,
    summary: projectContext.summary || "No summary provided",
    title: projectContext.title,
  });

  let finalPrompt = createFinalPrompt(codeTask);

  const result = await llm.runTools(
    {
      maxTokens: 4000,
      temperature: 0.2,
      tools: {
        readFileContents: createReadFilesTool(projectContext.absolutePath),
      },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            ...userMessageTextContents,
            { type: "text", text: finalPrompt },
          ],
        },
      ],
    },
    {
      emitter,
    }
  );
  console.log(
    "🚀 | generateSpecifications:",
    result.experimental_providerMetadata
  );

  return result.text.trim();
};

const createSystemPrompt = (taskType: string) => {
  const taskDescriptions = {
    bugFix: "writing detailed bug specifications",
    newFeature: "creating comprehensive new feature specifications",
    refactor: "outlining clear refactoring specifications",
    documentation: "crafting thorough documentation specifications",
  };

  return `You are an expert software engineer tasked with ${
    taskDescriptions[taskType as keyof typeof taskDescriptions]
  }. Your goal is to create a clear, concise, and actionable specification based on the provided information. Follow these steps:

  1. Analyze the task: Carefully review the provided information and task description.
  
  2. Identify relevant files: Based on the task, think about which files in the <file_structure> might be relevant. List these files and explain why they're important.
  
  3. Read file contents: If any of the relevant files have not been provided already in the <file_contents>, Use the \`readFileContents\` tool to read the contents of the missing file. Pass an array of filepaths to this tool.
  
  4. Process information: Analyze the contents of the identified files and extract key information relevant to the task.
  
  5. Create specification: Using the gathered information, create a clear and actionable specification. Focus on essential details that will help developers understand and implement the task efficiently.

## Response Format
- First provide your thought process in <thought> tags.
  
When ready, provide important filepaths in a <files> tag, one filepath per line. Then finally, provide the final specification in markdown format. Remember, the goal is to transform raw, unstructured ideas into well-structured backlog items, not to solve the problem or implement a solution. Ensure that project objectives are clearly defined and effectively communicated.
  `;
};

const createFinalPrompt = (codeTask: WriteSpecsInput["codeTask"]) => {
  const templates = {
    bugFix: `
**Title**: [Concise description of the bug]

**Description**:
- What is the current behavior?
- What is the expected behavior?
- Steps to reproduce:
  1. 
  2. 
  3. 

**Additional context**: [Any screenshots, error messages, or relevant information]
`,
    newFeature: `
**Title**: [Brief description of the new feature]

**Description**:
- What problem does this feature solve?
- High-level description of the feature:

**Acceptance Criteria**:
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

**Additional context**: [Any mockups, or relevant information. Leave out technical details, that will come later. Focus on the requirements gathering an specifications.]
`,
    refactor: `
**Title**: [Area or component to be refactored]

**Description**:
- What is the current issue with the code?
- What improvements will this refactor bring?
`,
    documentation: `
**Title**: [Topic or area to be documented]

**Description**:
- What needs to be documented?
- Who is the target audience?

**Outline**:
- Main sections to be covered:
  1. 
  2. 
  3. 

**Additional context**: [Any existing documentation, style guides, or relevant information]
`,
  };

  return `Based on the provided information, create a detailed ${
    codeTask.taskType
  } specification following this structure:

<template>
${templates[codeTask.taskType as keyof typeof templates]}
</template>

Ensure your response is in markdown format and follows this structure closely. Don't return the template tag, just the markdown.


${
  codeTask.specifications && codeTask.followupInstructions
    ? `
Previous specifications:\n${codeTask.specifications}\n\nFollowup instructions:\n${codeTask.followupInstructions}\n\nPlease update the previous specifications based on the followup instructions while maintaining the overall structure.
`
    : `Please help me write a specification for the following user input:\n${codeTask.input}`
}
`;
};
