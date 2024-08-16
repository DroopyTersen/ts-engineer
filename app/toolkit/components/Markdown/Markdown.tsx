import MarkdownToJSX from "markdown-to-jsx";
import mermaid from "mermaid";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (ref.current) {
      mermaid.init(undefined, ref.current);
    }
  }, [children]);

  return (
    <div
      ref={ref}
      className="mermaid not-prose"
      // style={{
      //   backgroundColor: "#f00",
      //   color: "#f8f8f2",
      //   padding: "10px",
      //   borderRadius: "5px",
      // }}
    >
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
