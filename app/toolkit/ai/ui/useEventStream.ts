import { useState } from "react";
// import { readTextStream } from "./readTextStream";
import { JSONValue } from "ai";
import { useAbortController } from "~/toolkit/hooks/useAbortController";
import { fetchEventStream } from "../streams/readStream";

let useStream = <TInputData>(
  fetchStream: (
    input: TInputData,
    abortController?: AbortController
  ) => Promise<any>
) => {
  let [streamId, setStreamId] = useState(() => generateId("stream-init"));
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  let { getAbortController, createAbortController } = useAbortController();

  let generate = async (input: TInputData) => {
    console.log("🚀 | generate | input:", input);
    // Clean up any existing streams before starting a new one
    let abortController = createAbortController();
    setStatus("loading");
    setStreamId(generateId("stream"));

    await fetchStream(input, abortController)?.catch((err) => {
      if (abortController.signal.aborted) {
        console.log("🚀 | generate | aborted");
        setStatus("idle");
        return;
      }
      console.error("🚀 | generate | err:", err?.message);
      setStatus("error");
    });

    setStatus("idle");
    return;
  };
  let cancel = () => {
    let abortController = getAbortController();
    console.log("calling cancel!!!", abortController?.signal);
    abortController?.abort();
    setStatus("idle");
  };

  return {
    id: streamId,
    status,
    generate,
    cancel,
  };
};

export function useEventStream<TInputData = any>(
  apiPath: string,
  onEvent: (event: { event: string; data: JSONValue }) => void
) {
  return useStream<TInputData>(async (input, abortController) => {
    await fetchEventStream(apiPath, input, onEvent, abortController);
  });
}

const generateId = (prefix: string) => {
  return prefix + Date.now().toString();
};
