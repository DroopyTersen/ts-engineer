import MarkdownToJSX from "markdown-to-jsx";
import React from "react";
import { cn } from "~/shadcn/utils";
import { ChartRenderer } from "./ChartRenderer";
import { MermaidDiagram } from "./MermaidDiagram";
import { SyntaxHighlightedCode } from "./SyntaxHighlightedCode";

export const Markdown = React.memo(
  ({
    children,
    className,
    id,
  }: {
    children: string;
    className?: string;
    id?: string;
  }) => {
    return (
      <div
        className={cn(
          "prose max-w-4xl [&_table_th]:text-left [&>div>*]:mt-0 whitespace-pre-wrap ",
          className
        )}
        id={id}
      >
        <MarkdownToJSX
          options={{
            overrides: {
              // code: {
              //   component: ({ className, children }) => {
              //     const language = className?.split("-")[1];
              //     if (language === "mermaid") {
              //       return <MermaidDiagram>{children}</MermaidDiagram>;
              //     } else if (language === "chart") {
              //       return <ChartRenderer config={children} />;
              //     }
              //     return <code className={className}>{children}</code>;
              //   },
              // },
              thought: {
                component: ThoughtBox,
              },
              questions: {
                component: ThoughtBox,
              },
              draft: ThoughtBox,
              pre: {
                component: ({ className, children }) => {
                  if (children?.type === "code") {
                    const language =
                      children?.props?.className?.split("-")?.[1] || "txt";
                    if (language === "mermaid") {
                      return (
                        <MermaidDiagram>
                          {children?.props?.children}
                        </MermaidDiagram>
                      );
                    } else if (language === "chart") {
                      return (
                        <ChartRenderer config={children?.props?.children} />
                      );
                    }
                    return (
                      <SyntaxHighlightedCode
                        className={className}
                        lang={language}
                      >
                        {children?.props?.children}
                      </SyntaxHighlightedCode>
                    );
                  }
                  return <pre className={className}>{children}</pre>;
                },
              },
            },
          }}
        >
          {children}
        </MarkdownToJSX>
      </div>
    );
  }
);

const ThoughtBox = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-sm bg-gray-100 p-4 rounded-md mb-4">
      <span className="font-bold flex items-center gap-2">
        <span className="text-3xl leading-5">🤔</span> Thinking...
      </span>
      {children}
    </div>
  );
});
