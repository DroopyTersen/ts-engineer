import { ToolCallPart } from "ai";
import { LLMEventEmitter } from "~/toolkit/ai/streams/LLMEventEmitter";
import { LLMTelemetry, TelemetryLLMSpan, TelemetrySpan } from "./LLMTelemetry";

export const traceLLMEventEmitter = ({
  emitter,
  telemetry,
  parentObserverableId,
}: {
  emitter: LLMEventEmitter;
  telemetry: LLMTelemetry;
  parentObserverableId: string;
}) => {
  let toolCalls = new Map<string, TelemetrySpan>();
  let llmSpan: TelemetryLLMSpan;
  emitter.on("llm_start", (params) => {
    let label = "unknown";
    let lastMessage = params.messages?.[params.messages.length - 1];
    let lastMessageRole = lastMessage?.role;

    if (lastMessageRole === "user") {
      label = "User Input";
    } else if (lastMessageRole === "tool") {
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

    llmSpan = telemetry
      .createLLMSpan(label, parentObserverableId)
      .start(params);
  });

  emitter.on("llm_end", (result) => {
    llmSpan?.end?.(result);
  });

  emitter.on("tool_call", (toolCall) => {
    let toolSpan = telemetry.createSpan(toolCall.name, parentObserverableId);
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
