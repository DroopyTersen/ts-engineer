import OpenAI from "openai";
import { JSONValue, ToolCall, ToolResult } from "./LLMDataStream";

export type LLMEvent =
  | {
      type: "log";
      data: string;
    }
  | {
      type: "error";
      data: JSONValue;
    }
  | {
      type: "message";
      data: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam;
    }
  | {
      type: "tool_call";
      data: ToolCall;
    }
  | {
      type: "tool_result";
      data: ToolResult;
    }
  | { type: "content"; data: string }
  | { type: "llm_start"; data: any }
  | { type: "llm_end"; data: any }
  | { type: "final_content"; data: string };

// Helper type to extract the data type associated with a specific event type
type ExtractDataType<T> = Extract<LLMEvent, { type: T }>["data"];

export class LLMEventEmitter {
  private listeners: Record<string, ((data: any) => void)[]> = {};

  // Method to emit events, ensuring the data type matches the event type
  emit<T extends LLMEvent["type"]>(type: T, data: ExtractDataType<T>): void {
    this.listeners[type]?.forEach((listener) => listener(data));
  }

  // Method to subscribe to events, ensuring the callback matches the data type for the event type
  on<T extends LLMEvent["type"]>(
    type: T,
    listener: (data: ExtractDataType<T>) => void
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  // Method to unsubscribe from events
  off<T extends LLMEvent["type"]>(
    type: T,
    listenerToRemove: (data: ExtractDataType<T>) => void
  ): void {
    if (!this.listeners[type]) {
      return;
    }
    this.listeners[type] = this.listeners[type].filter(
      (listener) => listener !== listenerToRemove
    );
  }
}
