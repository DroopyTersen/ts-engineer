import { z } from "zod";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getLLM, LLM } from "~/toolkit/ai/vercel/getLLM";

export const scoreFileRelevancy = async (
  input: {
    codeTask: string;
    questions: string[];
    fileStructure?: string;
    projectSummary?: string;
    file: {
      filepath: string;
      content: string;
    };
  },
  options?: {
    llm?: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  // Weird thing where trying to score this file makes it go bonkers
  // Infinite loop kind of thing?
  if (input.file?.filepath.includes("scoreFileRelevancy")) {
    return -1;
  }
  let systemPrompt = getSystemPrompt(
    input.file,
    input.fileStructure,
    input.projectSummary
  );
  let llm = options?.llm || getLLM("deepseek", "deepseek-coder");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    let result = await llm
      .generateData({
        maxRetries: 0,
        system: systemPrompt,
        prompt: `CodeTask: ${input.codeTask}\n\t${input.questions.join(
          "\n\t"
        )}`,
        schema: z.object({
          score: z.number().int().min(0).max(4),
        }),
        abortSignal: controller.signal,
      })
      .catch((err) => {
        console.error(input.file.filepath, err);
        return {
          object: {
            score: -1,
          },
        };
      });

    return result.object.score;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getSystemPrompt = (
  file: { filepath: string; content: string },
  fileStructure?: string,
  projectSummary?: string
) => {
  return `You are an expert software developer with extensive experience in analyzing codebases. Your task is to evaluate the relevance of source code files to a given coding task and associated questions. You will be provided with a specific coding task, follow-up questions, and the contents of a source code file. Your job is to assess how relevant the file is to completing the coding task and/or answering the provided questions.

Use the following scoring system to rate the relevance of each file:

4 - The file is directly needed to implement the coding task
3 - The file might help answer some of the posed questions
2 - The file contains information that could be indirectly useful
1 - The file likely doesn't need to be considered to implement the task
0 - The file has NOTHING to do with the coding task

Carefully analyze the file contents, considering:
- Direct relevance to the coding task
- Potential to answer any of the follow-up questions
- Does the file contain examples of patterns or code usages that could help with the coding task?
- Indirect connections or similarities to the task or questions
- Presence of related components, functions, or data structures
- Reusable patterns or code that could be applied to the task

After your analysis, provide only the numerical score (0-4) that best represents the file's relevance. Do not include any explanations, comments, or additional text in your response. Your output should consist solely of a single number between 0 and 4.

${projectSummary ? `## Project Summary\n${projectSummary}` : ""}

${
  fileStructure
    ? `## File Structure
Here is the file structure of the project:
\`\`\`
${fileStructure}
\`\`\``
    : ""
}

## File Contents
${file.filepath}

${file.content}

`;
};
