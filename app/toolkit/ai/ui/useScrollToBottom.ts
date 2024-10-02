import { useEffect, useRef, useState } from "react";
export const useScrollToBottom = (isLoading: boolean, selector?: string) => {
  let scrollContainerRef = useRef<HTMLElement | Element | null>(null);

  useEffect(() => {
    if (selector) {
      scrollContainerRef.current = selector
        ? document.querySelector(selector)
        : document.documentElement;
    }
  }, [selector]);

  const [isAtBottom, setIsAtBottom] = useState(() => {
    if (!scrollContainerRef.current) return true;

    const scrollContainer = scrollContainerRef.current;

    const scrollPosition =
      scrollContainer.scrollTop + scrollContainer.clientHeight;
    const documentHeight = scrollContainer.scrollHeight;

    const atBottom = scrollPosition >= documentHeight - 10;
    return atBottom;
  });

  const hasLoadedOnceRef = useRef(false);

  const scrollToBottom = (behavior: "instant" | "smooth" = "smooth") => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: behavior,
    });
    setIsAtBottom(true);
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const handleScroll = () => {
      if (!scrollContainer) return;
      const scrollPosition =
        scrollContainer.scrollTop + scrollContainer.clientHeight;
      const documentHeight = scrollContainer.scrollHeight;

      const atBottom = scrollPosition >= documentHeight - 100;
      // console.log(
      //   "🚀 | const[isAtBottom,setIsAtBottom]=useState | scrollPosition:",
      //   { scrollPosition, documentHeight, atBottom }
      // );
      setIsAtBottom(atBottom);
    };

    const autoScroll = () => {
      scrollToBottom("instant");
    };

    handleScroll(); // Check initial scroll position
    scrollContainer.addEventListener("scroll", handleScroll);
    // window.addEventListener("resize", autoScroll);

    if (isAtBottom && isLoading) {
      // Only set up the interval if we need to stick to the bottom
      const scrollInterval = setInterval(autoScroll, 100);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        // window.removeEventListener("resize", autoScroll);
        clearInterval(scrollInterval);
      };
    } else {
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        // window.removeEventListener("resize", autoScroll);
      };
    }
  }, [isAtBottom, isLoading]);

  useEffect(() => {
    if (!isLoading && isAtBottom && hasLoadedOnceRef.current) {
      const timeoutId = setTimeout(() => {
        scrollToBottom("smooth");
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    if (isLoading) {
      hasLoadedOnceRef.current = true;
    }
  }, [isLoading]);

  return { isAtBottom, scrollToBottom };
};
