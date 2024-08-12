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

export class ConsoleTelemetry implements LLMTelemetry {
  createTrace(name: string, input: TelemetryTraceInput): TelemetryTrace {
    const traceId = input.traceId || `trace-${Date.now()}`;
    console.log(`📊 START | ${name} | ${traceId}`, input);

    let _data: TelemetryData = {};
    let trace = {
      id: traceId,
      end: (output: JSONValue, extraData?: TelemetryData) => {
        _data = { ..._data, output: output, ...extraData };
        console.log(`📊 END | ${name} | ${traceId}`, _data);
      },
      update: (data: TelemetryData) => {
        _data = { ..._data, ...data };
        return trace;
      },
    };

    return trace;
  }

  createSpan(name: string, parentId?: string): TelemetrySpan {
    const spanId = `span-${Date.now()}`;
    let _data: TelemetryData = {};

    let span = {
      id: spanId,
      parentId,
      start: (input: JSONValue, extraData?: TelemetryData) => {
        _data = { input: input, ...extraData };
        console.log(`📊 START | ${name} | ${spanId}`, _data);
        return span;
      },
      update: (data: TelemetryData) => {
        _data = { ..._data, ...data };
        return span;
      },
      end: (output: JSONValue, extraData?: TelemetryData) => {
        _data = { ..._data, output: output, ...extraData };
        console.log(`📊 END | ${name} | ${spanId}`, _data);
      },
    };

    return span;
  }

  createLLMSpan(name: string, parentId?: string): TelemetryLLMSpan {
    const spanId = `span-${Date.now()}`;
    let _data: TelemetryData = {};

    let span = {
      id: spanId,
      parentId,
      start: (input: LLMStartData, extraData?: TelemetryData) => {
        _data = { input: JSON.parse(JSON.stringify(input)), ...extraData };
        console.log(`📊 START | ${name} | ${spanId}`, _data);
        return span;
      },
      update: (data: TelemetryData) => {
        _data = { ..._data, ...data };
        return span;
      },
      end: (output: LLMEndData, extraData?: TelemetryData) => {
        _data = {
          ..._data,
          output: JSON.parse(JSON.stringify(output)),
          ...extraData,
        };
        console.log(`📊 END | ${name} | ${spanId}`, _data);
      },
    };

    return span;
  }
}
