import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { getDb } from "../db/pglite/pglite.server";
import { generateAnswer } from "../llm/generateAnswer";

export const answerQuestion = async (
  input: {
    query: string;
    fileIds: string[];
  },
  options?: {
    emitter?: LLMEventEmitter;
  }
) => {
  const db = getDb();
  const fileQuery = await db.query(
    "SELECT id, filepath, content, project_id FROM files WHERE id = ANY($1)",
    [input.fileIds]
  );

  const fileContents = fileQuery.rows.map((file: any) => ({
    filepath: file.filepath,
    content: file.content,
  }));

  const validFileContents = fileContents.filter(
    (file): file is NonNullable<typeof file> => file !== null
  );

  const llm = getLLM("anthropic", "claude-3-5-sonnet-20240620");
  const answer = await generateAnswer(
    {
      query: input.query,
      fileContents: validFileContents,
    },
    {
      llm,
      emitter: options?.emitter,
    }
  );

  return answer;
};
