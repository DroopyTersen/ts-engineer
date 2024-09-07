import { ToolCallPart } from "ai";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { LLMTelemetry, TelemetryLLMSpan, TelemetrySpan } from "./LLMTelemetry";

export const traceLLMEventEmitter = ({
  emitter,
  telemetry,
  parentObservableId,
}: {
  emitter: LLMEventEmitter;
  telemetry: LLMTelemetry;
  parentObservableId: string;
}) => {
  let activeSpans = new Map<string, TelemetryLLMSpan>();
  let toolCalls = new Map<string, TelemetrySpan>();
  emitter.on("llm_start", (params) => {
    let label = params.label || "";
    let lastMessage = params.messages?.[params.messages.length - 1];
    let lastMessageRole = lastMessage?.role;

    if (lastMessageRole === "user" && !label) {
      label = "User Input";
    } else if (lastMessageRole === "tool" && !label) {
      label = "Tool Result";
      let toolCallId = (lastMessage?.content?.[0] as ToolCallPart)?.toolCallId;
      let toolCallMessage = params.messages?.find(
        (m) =>
          m.role === "assistant" &&
          (m.content as Array<ToolCallPart>)?.some(
            (c: any) => c.toolCallId === toolCallId
          )
      );
      if (toolCallMessage) {
        let toolCall = (toolCallMessage.content as ToolCallPart[]).find(
          (c: any) => c.toolCallId === toolCallId
        );
        if (toolCall) {
          label = toolCall?.toolName + " Result";
        }
      }
    }

    let llmSpan = telemetry
      .createLLMSpan(label, parentObservableId, params.requestId)
      .start(params);
    activeSpans.set(params.requestId, llmSpan);
  });

  emitter.on("llm_end", (result) => {
    let llmSpan = activeSpans.get(result.requestId);
    if (!llmSpan) {
      console.error("LLM Span not found for requestId", result.requestId);
    }
    llmSpan?.end?.(result);
  });

  emitter.on("tool_call", (toolCall) => {
    let toolSpan = telemetry.createSpan(
      "Tool: " + toolCall.name,
      parentObservableId
    );
    toolSpan.start(toolCall);
    toolCalls.set(toolCall.id, toolSpan);
  });
  emitter.on("tool_result", (toolResult) => {
    let toolSpan = toolCalls.get(toolResult.toolCallId);
    if (toolSpan) {
      toolSpan.end(toolResult);
    }
  });
};
