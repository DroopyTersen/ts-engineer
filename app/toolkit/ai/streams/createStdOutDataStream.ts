import type { JSONValue } from "ai";
import type { LLMDataStream, ToolCall, ToolResult } from "./LLMDataStream";
import type { LLMEvent } from "./LLMEventEmitter";

export interface StdOutDataStream extends LLMDataStream {
  write: (text: string) => void;
  writeLine: (line: string) => void;
}

export const createStdOutDataStream = ({
  exclude,
}: {
  exclude?: LLMEvent["type"][];
} = {}): StdOutDataStream => {
  exclude = exclude || [];
  const write = (text: string) => {
    process.stdout.write(text);
  };
  const writeLine = (line: string) => {
    process.stdout.write(line + "\n");
  };
  const sendText = (text: string) => {
    if (exclude.includes("content")) {
      return;
    }
    write(text);
  };
  const sendReasoning = (reasoning: string) => {
    if (exclude.includes("reasoning")) {
      return;
    }
    writeLine("Reasoning: " + reasoning);
  };
  const sendLog = (message: string) => {
    if (exclude.includes("log")) {
      return;
    }
    console.log(message);
  };
  const sendToolCall = (toolCall: ToolCall) => {
    if (exclude.includes("tool_call")) {
      return;
    }
    writeLine("Tool call: " + JSON.stringify(toolCall, null, 2));
  };
  const sendToolResult = (toolResult: ToolResult) => {
    if (exclude.includes("tool_result")) {
      return;
    }
    writeLine("Tool result: " + JSON.stringify(toolResult, null, 2));
  };
  const sendError = (error: JSONValue) => {
    console.error(error);
  };
  const sendData = (data: JSONValue) => {
    if (exclude.includes("data")) {
      return;
    }
    writeLine("Data: " + JSON.stringify(data, null, 2));
  };
  console.log = (...args) => {
    if (exclude.includes("log")) {
      return;
    }
    console.log(...args);
  };

  return {
    write,
    writeLine,
    sendText,
    sendLog,
    sendToolCall,
    sendToolResult,
    sendError,
    sendData,
    sendReasoning,
  };
};
