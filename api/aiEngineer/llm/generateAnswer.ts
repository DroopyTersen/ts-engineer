import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";

type GenerateAnswerInput = {
  query: string;
  fileContents: Array<{ filepath: string; content: string }>;
};

export const generateAnswer = async (
  input: GenerateAnswerInput,
  options: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  const { query, fileContents } = input;
  const { llm, emitter } = options;

  const systemPrompt = `You are an AI assistant tasked with answering questions about a codebase. Use the provided file contents to answer the user's query. Always cite the relevant files in your answer.`;

  const userPrompt = `
Query: ${query}

Relevant file contents:
${fileContents
  .map(
    (file) => `
File: ${file.filepath}
Content:
${file.content.slice(0, 1000)}${file.content.length > 1000 ? "..." : ""}
`
  )
  .join("\n")}

Please provide a concise and accurate answer to the query based on the given file contents. Include citations to the relevant files.`;

  const result = await llm.streamText(
    {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
      maxTokens: 2000,
    },
    { emitter }
  );

  return result.text;
};
