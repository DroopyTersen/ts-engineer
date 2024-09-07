import { LLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";

export const summarizeCodeFile = async (
  filepath: string,
  fileContents: string,
  {
    llm,
    emitter,
  }: {
    llm: LLM;
    emitter?: LLMEventEmitter;
  }
) => {
  let systemPrompt = createSystemPrompt();
  let userPrompt = `
Filepath: ${filepath}
\`\`\`
${fileContents}
\`\`\`
      `.trim();

  let result = await llm.streamText(
    {
      maxTokens: 300,
      temperature: 0.5,
      system: systemPrompt,
      prompt: userPrompt,
    },

    {
      emitter,
    }
  );
  return result.text;
};

const createSystemPrompt = () => {
  return `You are an expert software engineer specializing in API documentation. Your task is to analyze the provided source code file and generate a concise, informative summarization of the file. Focus on its public interface and overall purpose. It should only be one or two sentences.
  
Follow these guidelines:

1. If it's UI code (like HTML or a React componet), describe what the user seees and what they can do with it.
2. If it's a utility function, describe it's purpose and when a developer might leverage it. Also describe any inputs and outputs.
3. If it's a data access function, describe the data entities, and any business logic around it. Also describe any inputs and outputs.
4. If it's a business logic function, describe the business logic and what it does. Also describe any inputs and outputs.

Important:
- Prioritize information relevant to users of the API, not implementation details.
- Use clear, concise language suitable for both human developers and language models.
- Balance informativeness with token efficiency.
- Be succinct, but don't omit important details but don't repeat anything either.

The user will provide you with a filepath and file contents. Respond with a 1 or two sentence summarization of the file.

This is to help and LLM understand the codebase and generate better code that leverages this code file.

`;
};
