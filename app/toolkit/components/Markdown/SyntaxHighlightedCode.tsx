import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/shadcn/utils";
import { useIsHydrated } from "~/toolkit/remix/useIsHydrated";
import { debounce } from "~/toolkit/utils/debounce";

// Cache for storing highlighted code
const cachedCode: Map<string, string> = new Map();

export const SyntaxHighlightedCode = ({
  className,
  children,
}: {
  className?: string;
  children: string;
}) => {
  let isHydrated = useIsHydrated();
  const [highlightedCode, setHighlightedCode] = useState<string>(
    () => cachedCode.get(children) || ""
  );
  const language = className?.split("-")[1] || "plaintext";
  let isFetchingRef = useRef(false);
  const codeRef = useRef<HTMLSpanElement>(null);

  const debouncedHighlightCode = useCallback(
    debounce(async () => {
      if (isFetchingRef.current) {
        return;
      }

      if (cachedCode.has(children)) {
        setHighlightedCode(cachedCode.get(children)!);
        return;
      }

      isFetchingRef.current = true;
      try {
        const response = await fetch("/api/syntax-highlight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: children,
            lang: language,
            theme: "slack-dark",
            structure: "inline",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch highlighted code");
        }

        const data = await response.json();
        setHighlightedCode(data.html);
        cachedCode.set(children, data.html);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(`<code>${children}</code>`);
      } finally {
        isFetchingRef.current = false;
      }
    }, 200),
    [children, language]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingRef.current &&
          !highlightedCode
        ) {
          debouncedHighlightCode();
        }
      },
      { threshold: 0.5 }
    );

    if (codeRef.current) {
      observer.observe(codeRef.current);
    }

    return () => {
      if (codeRef.current) {
        observer.unobserve(codeRef.current);
      }
    };
  }, [debouncedHighlightCode]);

  return (
    <code
      className={cn("shiki", className)}
      ref={codeRef}
      dangerouslySetInnerHTML={{ __html: highlightedCode || children }}
    />
  );
};
