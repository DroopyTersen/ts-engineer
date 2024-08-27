import { JSONValue } from "~/toolkit/ai/streams/LLMDataStream";
import { LLMEndData, LLMStartData } from "~/toolkit/ai/streams/LLMEventEmitter";
import { Prettify } from "~/toolkit/utils/typescript.utils";

export type TelemetryTraceInput = {
  /* For grouping multiples traces */
  sessionId?: string;
  /* Will be auto generated if not provided */
  traceId?: string;
  user?: TelemetryUser;
  input?: JSONValue;
};

export type TelemetryData = Prettify<
  Record<string, JSONValue> & {
    input?: JSONValue;
    output?: JSONValue;
  }
>;

export type TelemetryUser = {
  id: string;
  name?: string;
  email?: string;
};
export type TelemetryTrace = {
  id: string;
  update: (data: TelemetryData) => TelemetryTrace;
  end: (output: JSONValue, extraData?: TelemetryData) => void;
};

export type TelemetrySpan = {
  id: string;
  parentId?: string;
  start: (input: JSONValue, extraData?: TelemetryData) => TelemetrySpan;
  update: (data: TelemetryData) => TelemetrySpan;
  end: (output: JSONValue, extraData?: TelemetryData) => void;
};

export type TelemetryLLMSpan = {
  id: string;
  parentId?: string;
  start: (params: LLMStartData) => TelemetryLLMSpan;
  end: (result: LLMEndData) => void;
};

export interface LLMTelemetry {
  createTrace: (name: string, input: TelemetryTraceInput) => TelemetryTrace;
  createSpan: (name: string, parentId?: string) => TelemetrySpan;
  createLLMSpan: (
    name: string,
    parentId?: string,
    observableId?: string
  ) => TelemetryLLMSpan;
}
