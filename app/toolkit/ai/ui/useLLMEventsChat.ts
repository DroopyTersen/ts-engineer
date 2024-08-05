import { useEffect, useRef, useState } from "react";
// import { readTextStream } from "./readTextStream";
import { useUpdateEffect } from "~/toolkit/hooks/useUpdateEffect";
import { LLMDataMessage, parseLLMEvents } from "../streams/LLMDataStream";
import { LLMEvent } from "../streams/LLMEventEmitter";
import { useEventStream } from "./useEventStream";

export type LLMEventsChatOptions<TInputData = any> = {
  apiPath: string;
  bodyInput?: TInputData;
  initialMessages?: LLMDataMessage[];
};

export const useLLMEventsChat = <TInputData = any>({
  initialMessages,
  bodyInput,
  apiPath,
}: LLMEventsChatOptions) => {
  let [events, setEvents] = useState<LLMEvent[]>([]);
  let lastStreamIdRef = useRef<string>("");
  let [messages, setMessages] = useState<LLMDataMessage[]>(
    initialMessages || []
  );
  let inputRef = useRef<any>(null);

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

  useUpdateEffect(() => {
    if (eventStream.status === "idle" && events?.length > 0) {
      let mostRecentMessage: LLMDataMessage = {
        role: "assistant",
        id: lastStreamIdRef.current || generateId("stream"),
        ...parseLLMEvents(events),
      };
      setMessages((prev) => [...prev, mostRecentMessage]);
      setEvents([]);
    }
  }, [eventStream.id]);

  const submit = (userInput: string) => {
    let body = {
      ...bodyInput,
      messages: [...messages, { role: "user", content: userInput }],
    };
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userInput, id: generateId("user") },
    ]);
    generate(body);
  };

  const actions = {
    submit,
    cancel: () => {
      if (eventStream.status === "loading") {
        // Get the last user message to rehydrate the Textbox
        let lastUserMessage = messages
          .toReversed()
          .find((message) => message.role === "user");
        setMessages((prevMessages) => {
          // pull off the last user message
          return [...prevMessages.slice(0, -1)];
        });
        setEvents([]);
        inputRef.current?.setInputValue?.(lastUserMessage?.content);
        cancel();
      }
    },
    clearConversation: () => {
      setMessages([]);
      setEvents([]);
    },
    editMessage: (msgIndex: number) => {
      // find the target message
      let targetMessage = messages[msgIndex];
      if (eventStream.status !== "loading" && targetMessage.role === "user") {
        inputRef.current?.setInputValue(targetMessage.content);
        // update the messages state
        setMessages((prevMessages) => {
          return [...prevMessages.slice(0, msgIndex)];
        });
      }
    },
  };

  return {
    ...eventStream,
    inputRef,
    actions,
    isStreaming: eventStream.status === "loading",
    messages: [
      ...messages,
      mostRecentMessage ? mostRecentMessage : undefined,
    ].filter(Boolean) as LLMDataMessage[],
  };
};

const generateId = (prefix: string) => {
  return prefix + Date.now().toString();
};
