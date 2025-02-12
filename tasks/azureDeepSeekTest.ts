const ENDPOINT = "https://DeepSeek-R1-apeter.eastus.models.ai.azure.com";
const API_KEY = "qcPg4xrBmb7B85GiIBnEhMYHnyDTyHBS";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

const deepSeekClient = createDeepSeek({
  baseURL: ENDPOINT,
  apiKey: API_KEY,
});
let model = deepSeekClient("deepseek-reasoner");

let streamedResponse = await streamText({
  model,
  prompt:
    "What are some things to consider when refactoring a react component?",
});
console.log("Starting stream...\n\n");
for await (const textPart of streamedResponse.textStream) {
  process.stdout.write(textPart);
}

console.log("\n\nStream complete.");
