import { createReadFilesTool } from "api/aiEngineer/tools/readFiles.tool";
import { readUrlTool } from "api/aiEngineer/tools/readUrl.tool";
import { createSearchCodeSnippetsTool } from "api/aiEngineer/tools/searchCodeSnippets.tool";
import { searchWebTool } from "api/aiEngineer/tools/searchWeb.tool";
import { getCachedMessageContent, LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
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
    followUpInput?: string;
    stepBackQuestions?: string[];
  };
};

export const createCachedProjectMessageTextContents = (projectContext: {
  title: string;
  summary?: string;
  fileStructure: string;
  fileContents: string[];
}) => {
  return [
    {
      type: "text",
      text: `<title>${projectContext.title}</title>
  <summary>${projectContext.summary || "No summary provided"}</summary>
<file_structure>${projectContext.fileStructure}</file_structure>
    `,
    },
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
  console.log(
    "🚀 | userMessageTextContents:",
    JSON.stringify(userMessageTextContents, null, 2)
  );

  let finalPrompt = createFinalPrompt(codeTask);
  const result = await llm.streamText(
    {
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 2000 },
        },
      },
      maxSteps: 20,
      label: "generateSpecifications",
      maxTokens: 4000,
      temperature: 0.2,
      tools: {
        readUrlContents: readUrlTool,
        searchWeb: searchWebTool,
        readFileContents: createReadFilesTool(projectContext.absolutePath),
        searchCodeSnippets: createSearchCodeSnippetsTool(
          projectContext.absolutePath
        ),
      },
      startSequence: "<specifications>",
      stopSequences: ["</specifications>"],
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
  if (result.experimental_providerMetadata) {
    console.log("🚀 | LLMCache Usage:", result.experimental_providerMetadata);
  }
  return parseSpecifications(result.text.trim());
};

const parseSpecifications = (
  specText: string
): { title: string; specifications: string } => {
  const titleRegex = /^\s*\*\*Title\*\*:\s*(.+)$/m;
  const match = specText.match(titleRegex);
  const title = match ? match[1].trim() : "Untitled";

  return { title, specifications: specText };
};

const createSystemPrompt = (taskType: string) => {
  const taskDescriptions = {
    bugFix: "writing detailed bug specifications",
    feature: "creating comprehensive new feature specifications",
    refactor: "outlining clear refactoring specifications",
    documentation: "crafting thorough documentation specifications",
  };

  return `You are an expert software engineer tasked with ${
    taskDescriptions[taskType as keyof typeof taskDescriptions]
  }. Your goal is to create a clear, concise, and actionable specification based on the provided information. Follow these steps:

<process_guidelines>
  1. Analyze the task: Carefully review the provided information and task description.
  2. Identify relevant files: Based on the task, think about which files in the <file_structure> might be relevant. List these files and explain why they're important.
  3. Read file contents, <file_contents>: If any of the relevant files have not been provided already in the <file_contents>, Use the \`readFileContents\` tool to read the contents of the missing file. Pass an array of filepaths to this tool. IMPORTANT! - First check to see if the file was already provided in the <file_contents>. If it was you probably don't need to call the tool unless the contents were cutoff.
  4. Search for relevant code: After reading some files, if you have further questions about the codebase, use the \`searchCodeSnippets\` tool to find relevant code snippets related to the task. This can help you identify other files you may want to call readFileContents on. This can help you identify affected areas, understand current implementations, or find usage patterns. Use specific function names, variable names, or unique strings to narrow down your search. You only need to call this tool if the provided <file_contents> doesn't have the information you need.
  5. Process information: Analyze the contents of the identified files and extracted code snippets, and extract key information relevant to the task.
  6. Create specification: Using the gathered information, create a clear and actionable specification. Focus on essential details that will help developers understand and implement the task efficiently. Remember, the goal is a functional specification, NOT to create a technical spec. So things like acceptance criteria should be written so that they could be tested by an end user. AKA, update database schema is not a good acceptance criteria, because it is not testable by an end user.
</process_guidelines>

<tool_usage_guidelines>
Remember, you can call \`readFileContents\` and \`searchCodeSnippets\` multiple times in your process. It is important to review the relevant and pertinent files in the codebase to understand how to best define the specifications for the coding task. It would be strange to call getFileContents though on a file that was already provided in the <file_contents> section.
</tool_usage_guidelines>

<response_guidelines>
Provide the final specification in markdown format. Remember, the goal is to transform raw, unstructured ideas into well-structured backlog items, that clearly communication functional requirements, not to solve the problem or implement a solution. Ensure that project objectives are clearly defined and concisely and effectively communicated. 

IMPORTANT!! - Follow the formatting in the user provided template exactly!! Use bolds where they use bolds and headings only if they use headings. This is critical to matched their desired formatting! and put the final answer in <specifications> tags. There should be no other text in the <specifications> tag other than the filled out template!

IMPORTANT!! - YOU SHOULD NEVER call read_file_contents on a file that was already provided in the <file_contents> section. Reference it from <file_contents> section. don't waste tokens on extra tool calls!

For example, every <specifications> tag should start with **Title**: and all the sections should use bold labels not headings.
</response_guidelines>
  `;
};

const createFinalPrompt = (codeTask: WriteSpecsInput["codeTask"]) => {
  const templates: Record<CodeTaskType, string> = {
    bugfix: `**Title**: [Concise description of the bug]

**Description**:
- What is the current behavior?
- What is the expected behavior?
- Steps to reproduce:
  1. 
  2. 
  3. 

**Additional context**: [Any screenshots, error messages, or relevant information]
`,
    feature: `**Title**: [Brief description of the new feature]

**Description**:
- What problem does this feature solve?
- High-level description of the feature:

**Acceptance Criteria**:
- Criteria 1
- Criteria 2
- Criteria 3

**Additional context**: [Any mockups, or relevant information. Leave out technical details, that will come later. Focus on the requirements gathering an specifications.]
`,
    refactor: `**Title**: [Area or component to be refactored]

**Description**:
- What is the current issue with the code?
- What improvements will this refactor bring?
`,
    documentation: `**Title**: [Topic or area to be documented]

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

  return `
<questions_to_consider_when_choosing_files>
    ${
      codeTask.stepBackQuestions && codeTask.stepBackQuestions.length > 0
        ? `
    ${codeTask.stepBackQuestions.map((question) => `- ${question}`).join("\n")}
    `
        : ""
    } 
</questions_to_consider_when_choosing_files>

Based on the provided information, create a detailed ${
    codeTask.taskType
  } specification following this structure:
    
<specifications>
${templates[codeTask.taskType as keyof typeof templates]?.trim()}
</specifications>

Ensure your response is in markdown format and follows this structure closely. Return the final specifications according to the provided template in the <specifications> tags.
${
  codeTask.specifications && codeTask.followUpInput
    ? `
${
  codeTask.specifications
    ? `Previous specifications:
<previous_specifications>
${codeTask.specifications}
</previous_specifications>`
    : ""
}

Follow-up input:
<follow_up_input>
${codeTask.followUpInput}
</follow_up_input>

Please update the previous specifications based on the follow-up input while maintaining the overall structure. Generate the updated specifications entirely! Don't be lazy!
`
    : `Please help me write a specification for the following user input:\n${codeTask.input}`
}
`;
};
