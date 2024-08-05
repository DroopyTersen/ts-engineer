import { useEffect, useRef, useState } from "react";
import { LLMDataMessage, parseLLMEvents } from "../streams/LLMDataStream";
import { LLMEvent } from "../streams/LLMEventEmitter";
import { useEventStream } from "./useEventStream";

export const useLLMEventStream = <TInputData = any>({
  bodyInput,
  apiPath,
}: {
  bodyInput: TInputData;
  apiPath: string;
}) => {
  let [events, setEvents] = useState<LLMEvent[]>([]);
  let lastStreamIdRef = useRef<string>("");

  let { generate, cancel, ...eventStream } = useEventStream<
    TInputData & { messages: Array<{ role: string; content: string }> }
  >(apiPath, (event) => {
    try {
      setEvents((prevEvents) => {
        return [
          ...prevEvents,
          {
            type: event.event as any,
            data: event.data,
          },
        ];
      });
    } catch (err) {
      console.error("🚀 | useLLMEventsChat | err:", err);
    }
  });

  useEffect(() => {
    if (eventStream?.id) {
      lastStreamIdRef.current = eventStream.id;
    }
  }, [eventStream.id]);

  let mostRecentMessage: LLMDataMessage | null =
    events.length > 0
      ? {
          role: "assistant",
          id: eventStream.id || lastStreamIdRef.current,
          ...parseLLMEvents(events),
        }
      : null;
  useEffect(() => {});

  const submit = (userInput: string) => {
    let body = {
      ...bodyInput,
      messages: [{ role: "user", content: userInput }],
    };
    setEvents([]);
    generate(body);
  };

  const actions = {
    submit,
    cancel: () => {
      if (eventStream.status === "loading") {
        setEvents([]);
        cancel();
      }
    },
    clear: () => {
      setEvents([]);
    },
  };

  return {
    ...eventStream,

    actions,
    isStreaming: eventStream.status === "loading",
    message: mostRecentMessage,
  };
};
