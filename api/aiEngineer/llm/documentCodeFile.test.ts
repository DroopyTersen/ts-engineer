import { describe, expect, it, setDefaultTimeout } from "bun:test";
import fs from "fs/promises";
import { getLLM } from "~/toolkit/ai/llm/getLLM";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { documentCodeFile } from "./documentCodeFile";

describe.skip("llm.documentCodeFile", () => {
  setDefaultTimeout(30000);
  it("should generate documentation for getLLM.ts", async () => {
    let emitter = new LLMEventEmitter();
    emitter.on("content", console.log);
    // Arrange
    const filepath = "api/aiEngineer/llm/summarizeProjectMarkdown.ts";
    const fileContents = await fs.readFile(filepath, "utf-8");

    expect(fileContents.length).toBeGreaterThan(10);
    // Act
    const [deepseekResult, gpt4miniResult] = await Promise.all([
      documentCodeFile(filepath, fileContents, {
        llm: getLLM("deepseek", "deepseek-coder"),
        // emitter,
      }),
      documentCodeFile(filepath, fileContents, {
        llm: getLLM("openai", "gpt-4o-mini"),
        // emitter,
      }),
    ]);

    console.log("🚀 | documentCodeFile | deepseekResult:", deepseekResult);
    console.log("🚀 | documentCodeFile | gpt4miniResult:", gpt4miniResult);

    // Assertions for deepseekResult
    expect(deepseekResult).toBeDefined();
    expect(typeof deepseekResult).toBe("string");

    // Assertions for gpt4miniResult
    expect(gpt4miniResult).toBeDefined();
    expect(typeof gpt4miniResult).toBe("string");
  });
});
