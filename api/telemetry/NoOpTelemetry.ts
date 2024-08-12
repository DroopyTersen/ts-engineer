import { JSONValue } from "~/toolkit/ai/streams/LLMDataStream";
import { LLMEndData, LLMStartData } from "~/toolkit/ai/streams/LLMEventEmitter";
import {
  LLMTelemetry,
  TelemetryData,
  TelemetryLLMSpan,
  TelemetrySpan,
  TelemetryTrace,
  TelemetryTraceInput,
} from "./LLMTelemetry";

export class NoOpTelemetry implements LLMTelemetry {
  createTrace(_name: string, _input: TelemetryTraceInput): TelemetryTrace {
    const trace: TelemetryTrace = {
      id: "",
      update: (_data: TelemetryData) => trace,
      end: (_output: JSONValue, _extraData?: TelemetryData) => {},
    };
    return trace;
  }

  createSpan(_name: string, _parentId?: string): TelemetrySpan {
    const span: TelemetrySpan = {
      id: "",
      parentId: undefined,
      start: (_input: JSONValue, _extraData?: TelemetryData) => span,
      update: (_data: TelemetryData) => span,
      end: (_output: JSONValue, _extraData?: TelemetryData) => {},
    };
    return span;
  }

  createLLMSpan(_name: string, _parentId?: string): TelemetryLLMSpan {
    const llmSpan: TelemetryLLMSpan = {
      id: "",
      parentId: undefined,
      start: (_params: LLMStartData) => llmSpan,
      end: (_result: LLMEndData) => {},
    };
    return llmSpan;
  }
}
