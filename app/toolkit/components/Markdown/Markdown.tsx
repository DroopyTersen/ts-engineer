import MarkdownToJSX from "markdown-to-jsx";
import { cn } from "~/shadcn/utils";
import { ChartRenderer } from "./ChartRenderer";
import { MermaidDiagram } from "./MermaidDiagram";
import { SyntaxHighlightedCode } from "./SyntaxHighlightedCode";

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
        "prose prose-sm max-w-4xl [&_table_th]:text-left [&>div>*]:mt-0 whitespace-pre-wrap ",
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
                } else if (language === "chart") {
                  return <ChartRenderer config={children} />;
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
