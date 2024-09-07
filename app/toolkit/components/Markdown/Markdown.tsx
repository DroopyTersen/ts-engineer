import MarkdownToJSX from "markdown-to-jsx";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";
import { cn } from "~/shadcn/utils";

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

const SyntaxHighlightedCode = ({
  className,
  children,
}: {
  className?: string;
  children: string;
}) => {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const language = className?.split("-")[1] || "plaintext";

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const html = await codeToHtml(children, {
          lang: language,
          theme: "slack-dark",
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(`<pre><code>${children}</code></pre>`);
      }
    };

    highlightCode();
  }, [children, language]);

  return <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
};

export const Markdown = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-4xl whitespace-pre-wrap [&_table_th]:text-left [&>div>*]:mt-0",
        className
      )}
    >
      <MarkdownToJSX
        options={{
          overrides: {
            code: {
              component: ({ className, children }) => {
                const language = className?.split("-")[1];
                if (language === "mermaid") {
                  return <MermaidDiagram>{children}</MermaidDiagram>;
                } else {
                  return (
                    <SyntaxHighlightedCode className={className}>
                      {children}
                    </SyntaxHighlightedCode>
                  );
                }
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
