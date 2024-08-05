import { useSubmit } from "@remix-run/react";
import { useCallback, useEffect } from "react";

export function useRevalidate() {
  // We get the navigate function from React Rotuer
  let submit = useSubmit();
  // And return a function which will navigate to `.` (same URL) and replace it
  return useCallback(
    function revalidate() {
      console.log("🚀 | revalidate | revalidate");
      submit(
        { returnTo: location.href },
        { method: "post", action: "/api/revalidate" }
      );
    },
    [submit]
  );
}

export const useRefresh = useRevalidate;

export function useRevalidateOnActive() {
  let revalidate = useRevalidate();
  // setup a listenter for visibility change and if
  // the page becomes visible, revalidate
  useEffect(() => {
    let handler = () => {
      if (document.visibilityState === "visible") {
        revalidate();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
}
