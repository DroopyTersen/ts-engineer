import {
  Langfuse,
  LangfuseGenerationClient,
  LangfuseSpanClient,
  LangfuseTraceClient,
} from "langfuse";
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

const generateTraceId = (name: string) => crypto.randomUUID();
export class LangfuseTelemetry implements LLMTelemetry {
  activeObservables: Map<
    string,
    LangfuseTraceClient | LangfuseSpanClient | LangfuseGenerationClient
  > = new Map();
  constructor(private readonly langfuse: Langfuse) {}
  createTrace(name: string, input: TelemetryTraceInput): TelemetryTrace {
    const _trace = this.langfuse.trace({
      id: generateTraceId(name),
      name,
      input,
      sessionId: input.traceId,
      userId: input?.user?.email || input?.user?.id,
      metadata: {
        env: process.env.PUBLIC_ENV || undefined,
        email: input?.user?.email,
        name: input.user?.name,
      },
    });
    this.activeObservables.set(_trace.id, _trace);

    let trace = {
      id: _trace.id,
      end: (output: JSONValue, extraData?: TelemetryData) => {
        _trace.update({ output, ...extraData });
        this.activeObservables.delete(_trace.id);
        this.langfuse.flush();
      },
      update: (data: TelemetryData) => {
        _trace.update(data);
        return trace;
      },
    };

    this.langfuse.flush();

    return trace;
  }

  createSpan(name: string, parentId?: string): TelemetrySpan {
    let _span: LangfuseSpanClient;
    let id = generateTraceId(name);

    let span = {
      id,
      parentId,
      start: (input: JSONValue, extraData?: TelemetryData) => {
        _span = (
          this.activeObservables.get(parentId || "") || this.langfuse
        ).span({
          id,
          name,
          input,
          // startTime: new Date(),
          parentObservationId: parentId,
          ...extraData,
        });
        if (_span.id !== id) {
          console.error("IDS DON'T MATCH!!!", _span.id, span.id);
        }
        this.activeObservables.set(_span.id, _span);

        return span;
      },
      update: (data: TelemetryData) => {
        _span.update(data);
        return span;
      },
      end: (output: JSONValue, extraData?: TelemetryData) => {
        _span.end({ output, ...extraData });
        let id = _span.id;
        this.langfuse.flushAsync().then(() => {
          this.activeObservables.delete(id);
        });
      },
    };

    return span;
  }

  createLLMSpan(
    name: string,
    parentId?: string,
    oberservableId?: string
  ): TelemetryLLMSpan {
    let _generation: LangfuseGenerationClient;
    let id = oberservableId || generateTraceId(name);
    let llmSpan = {
      id,
      parentId,
      start: (input: LLMStartData, extraData?: TelemetryData) => {
        _generation = (
          this.activeObservables.get(parentId || "") || this.langfuse
        ).generation({
          id,
          name,
          parentObservationId: parentId,
          ...processLLMStartData(input),
          ...extraData,
        });
        this.activeObservables.set(_generation.id, _generation);
        return llmSpan;
      },
      update: (data: TelemetryData) => {
        _generation.update(data);
        return llmSpan;
      },
      end: (result: LLMEndData, extraData?: TelemetryData) => {
        _generation.end({
          modelParameters: {
            cachedTokens:
              (result.experimental_providerMetadata?.anthropic
                ?.cacheReadInputTokens as number) || 0,
          },
          output: result.object || result.text,
          usage: result?.usage
            ? {
                input:
                  result.usage?.promptTokens +
                  ((result.experimental_providerMetadata as any)?.anthropic
                    .cacheCreationInputTokens || 0),
                output: result.usage?.completionTokens,
              }
            : undefined,
        });
        let id = _generation.id;
        this.langfuse.flush();
        this.langfuse.flushAsync().then(() => {
          this.activeObservables.delete(id);
        });
      },
    };
    return llmSpan;
  }
}

type LangfuseGenerationInput = Parameters<Langfuse["generation"]>[0];

const processLLMStartData = (params: LLMStartData): LangfuseGenerationInput => {
  return {
    completionStartTime: new Date(),
    model: params.model?.modelId,
    input: params.messages?.length
      ? params.messages
      : [
          { role: "system", content: params?.system },
          { role: "user", content: params.prompt },
        ],
    modelParameters: {
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      seed: params.seed,
      toolChoice:
        "tools" in params ? JSON.stringify(params.toolChoice, null, 2) : "",
    },
    metadata: {
      tools:
        "tools" in params ? JSON.stringify(params.tools, null, 2) : undefined,
    },
  };
};
