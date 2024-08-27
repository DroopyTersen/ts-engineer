import MarkdownToJSX from "markdown-to-jsx";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

// // Initialize Mermaid with global options for a dark theme
// mermaid.initialize({
//   theme: "dark",
//   themeVariables: {
//     background: "#282a36",
//     primaryColor: "#ff79c6",
//     secondaryColor: "#bd93f9",
//     tertiaryColor: "#44475a",
//     primaryTextColor: "#f8f8f2",
//     secondaryTextColor: "#f1fa8c",
//     lineColor: "#ff79c6",
//   },
// });

// Custom component to render Mermaid diagrams
const MermaidDiagram = ({ children }: { children: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [diagramId] = useState(
    () => `mermaid-${Math.random().toString(36).substr(2, 9)}`
  );
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const validateAndRender = async () => {
      try {
        // Validate the Mermaid syntax
        await mermaid.parse(children);
        setIsValid(true);

        if (ref.current) {
          await mermaid.run({
            nodes: [ref.current],
            suppressErrors: true,
          });
        }
      } catch (error) {
        console.error("Mermaid diagram is invalid:", error);
        setIsValid(false);
      }
    };

    // Add a small delay to ensure the DOM is ready
    setTimeout(validateAndRender, 0);
  }, [children]);

  if (!isValid) {
    return null;
  }

  return (
    <div ref={ref} id={diagramId} className="mermaid not-prose">
      {children}
    </div>
  );
};

export const Markdown = ({ children }: { children: string }) => {
  return (
    <div className="prose prose-sm max-w-4xl [&_table_th]:text-left">
      <MarkdownToJSX
        options={{
          overrides: {
            code: {
              component: ({ className, children }) => {
                const language = className?.split("-")[1];
                return language === "mermaid" ? (
                  <MermaidDiagram>{children}</MermaidDiagram>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
            },
          },
        }}
      >
        {children}
      </MarkdownToJSX>
    </div>
  );
};
