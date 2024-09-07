import { generateId } from "ai";
import { memo, useEffect, useRef, useState } from "react";

import { useIsHydrated } from "~/toolkit/remix/useIsHydrated";

const checkIsBrowser = () => typeof window !== "undefined";
// Lazy load mermaid
const mermaidPromise =
  checkIsBrowser() && import("mermaid").then((m) => m.default);

export const MermaidDiagram = memo(({ children }: { children: string }) => {
  let [id] = useState(() => {
    return generateId(15);
  });
  let isHydrated = useIsHydrated();
  const ref = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const validateAndRender = async () => {
      try {
        const mermaid = await mermaidPromise;
        if (!mermaid) {
          return;
        }
        // Validate the Mermaid syntax
        await mermaid.parse(children);
        setIsValid(true);

        if (ref.current) {
          await mermaid.run({
            nodes: [document.getElementById(id)!],
            suppressErrors: true,
          });
        }
      } catch (error) {
        console.error("Mermaid diagram is invalid:", error);
        setIsValid(false);
      }
    };

    validateAndRender();
  }, [children]);

  if (!isValid || !isHydrated) {
    return <code className="shiki">{children}</code>;
  }

  return (
    <div ref={ref} className="mermaid not-prose" id={id}>
      {children}
    </div>
  );
});
