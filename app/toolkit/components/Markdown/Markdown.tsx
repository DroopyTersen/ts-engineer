import MarkdownToJSX from "markdown-to-jsx";
import { cn } from "~/shadcn/utils";
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
            // code: {
            //   component: ({ className, children }) => {
            //     const language = className?.split("-")[1];
            //     if (language === "mermaid") {
            //       return <MermaidDiagram>{children}</MermaidDiagram>;
            //     } else if (language === "chart") {
            //       return <ChartRenderer config={children} />;
            //     } else {
            //       return (
            //         <SyntaxHighlightedCode className={className}>
            //           {children}
            //         </SyntaxHighlightedCode>
            //       );
            //     }
            //   },
            // },
            thought: {
              component: ({ children }) => {
                return (
                  <div className="text-sm bg-gray-100 p-2 rounded-md">
                    <span className="font-bold">Thought:</span> {children}
                  </div>
                );
              },
            },
            draft: {
              component: ({ children }) => {
                return (
                  <div className="text-sm bg-gray-100 p-2 rounded-md">
                    <span className="font-bold">Draft:</span> {children}
                  </div>
                );
              },
            },
            pre: {
              component: ({ className, children }) => {
                if (children.type === "code") {
                  const language =
                    children.props.className?.split("-")?.[1] || "txt";
                  return (
                    <SyntaxHighlightedCode
                      className={className}
                      lang={language}
                    >
                      {children.props.children}
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
};
