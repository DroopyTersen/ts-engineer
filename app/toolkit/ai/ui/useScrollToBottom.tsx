import { useEffect, useRef } from "react";
import { useDebouncedUpdateEffect } from "~/toolkit/hooks/useDebounce";

export function useScrollToBottom({
  isLoading,
  messages,
  scrollContainerSelector = ".chat-messages-scroll-container",
}: {
  isLoading: boolean;
  messages: { content: string }[];
  /** CSS selector for the scroll container */
  scrollContainerSelector?: string;
}) {
  const userHasScrolledRef = useRef(false);

  // Detect user manual scrolling
  useEffect(() => {
    if (!isLoading) {
      userHasScrolledRef.current = false;
      return;
    }

    // @ts-ignore
    const scrollContainer = document.querySelector(scrollContainerSelector);
    const handleUserScroll = () => {
      userHasScrolledRef.current = true;
    };

    scrollContainer?.addEventListener("scroll", handleUserScroll);

    return () => {
      scrollContainer?.removeEventListener("scroll", handleUserScroll);
    };
  }, [isLoading]);

  // Scroll to the bottom as the text streams in, but only if the user hasn't manually scrolled
  useDebouncedUpdateEffect(
    (debouncedContent) => {
      console.log("🚀 | debouncedContent:", {
        debouncedContent,
        isLoading,
        hasScrolled: userHasScrolledRef.current,
      });
      if (isLoading && !userHasScrolledRef.current) {
        console.log(
          "🚀 | message content change isLoading && !userHasScrolledRef.current:",
          isLoading && !userHasScrolledRef.current,
          messages
        );
        scrollToBottom(scrollContainerSelector);
      }
    },
    messages?.[messages?.length - 1]?.content,
    300
  );

  // Scroll to the bottom when the text is done streaming in, but only if the user hasn't manually scrolled
  useDebouncedUpdateEffect(
    (debouncedIsLoading) => {
      console.log(
        "🚀 | !debouncedIsLoading && !userHasScrolledRef.current:",
        !debouncedIsLoading && !userHasScrolledRef.current
      );
      if (!debouncedIsLoading && !userHasScrolledRef.current) {
        scrollToBottom(scrollContainerSelector);
      }
      if (!debouncedIsLoading) {
        userHasScrolledRef.current = false;
      }
    },
    isLoading,
    300
  );
}

function scrollToBottom(selector: string) {
  // @ts-ignore
  let scrollContainer = document?.querySelector(selector);
  if (scrollContainer) {
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
  }
}
