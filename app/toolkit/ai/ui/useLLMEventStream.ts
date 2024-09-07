import { useState } from "react";
import { LLMDataMessage, parseLLMEvents } from "../streams/LLMDataStream";
import { LLMEvent } from "../streams/LLMEventEmitter";
import { useEventStream } from "./useEventStream";

export const useLLMEventStream = <TInputData = any>({
  bodyInput,
  apiPath,
}: {
  bodyInput: Partial<TInputData>;
  apiPath: string;
}) => {
  let [events, setEvents] = useState<LLMEvent[]>([]);

  let { generate, cancel, ...eventStream } = useEventStream<TInputData>(
    apiPath,
    (event) => {
      try {
        console.log("Event", eventStream.id, event);
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
    }
  );
  console.log("🚀 | eventStream:", eventStream.id);

  let mostRecentMessage: LLMDataMessage | null =
    events.length > 0
      ? {
          role: "assistant",
          id: eventStream.id,
          ...parseLLMEvents(events),
        }
      : null;

  // console.log(
  //   "🚀 | mostRecentMessage:",
  //   mostRecentMessage?.content,
  //   eventStream.id,
  //   events
  // );
  const submit = (input: Partial<TInputData>) => {
    let body = {
      ...bodyInput,
      ...input,
    };
    setEvents([]);
    generate(body as TInputData);
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
