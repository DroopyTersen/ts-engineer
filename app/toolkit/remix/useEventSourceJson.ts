import { useEffect, useRef } from "react";

export function useEventSourceJson<TData>(
  path: string,
  onData: (data: TData) => void,
  onClose?: () => void
) {
  let onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    if (!path) return;
    let eventSource = new EventSource(path);
    eventSource.onmessage = (event) => {
      console.log("🚀 | useEffect | event:", event);
      if (event?.data === "[DONE]") {
        console.log("🚀 | Event stream DONE. Closing event source");
        eventSource.close();
        if (onClose) onClose();
      } else {
        try {
          let data = JSON.parse(event.data);
          onDataRef.current(data);
        } catch (err) {
          console.log("🚀 | unable to parse data", event?.data);
          eventSource.close();
        }
      }
    };
    return () => {
      eventSource.close();
    };
  }, [path]);
}
