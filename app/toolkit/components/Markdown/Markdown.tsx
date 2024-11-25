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
    const processedMarkdown = addNewlinesAroundCodeBlocks(children);
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
              p: {
                component: ({ children, ...props }) => (
                  <div {...props}>{children}</div>
                ),
              },
            },
          }}
        >
          {processedMarkdown}
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

// we want to tweak the markdown a little to add an extra line break before and after any
// code blocks if it isn't already there
/**
3. Route Implementation:
```typescript
// Example route implementation
export default function DataSourceRoute() {
  const { dataSourceId } = useParams();
  const { content, isLoading, loadContent } = useDataSourceContent(dataSourceId);
  
  useEffect(() => {
    loadContent();
  }, [dataSourceId]);

  if (isLoading) return <LoadingIndicator />;
  
  return <DataSourceView content={content} />;
}
```

Should become:
3. Route Implementation:

```typescript
// Example route implementation
export default function DataSourceRoute() {
  const { dataSourceId } = useParams();
  const { content, isLoading, loadContent } = useDataSourceContent(dataSourceId);
  
  useEffect(() => {
    loadContent();
  }, [dataSourceId]);

  if (isLoading) return <LoadingIndicator />;
  
  return <DataSourceView content={content} />;
}
```
     */
const addNewlinesAroundCodeBlocks = (markdown: string) => {
  // Match code blocks that aren't preceded by a newline
  // Using negative lookbehind (?<!\n) to ensure no newline before
  return markdown.replace(/(?<!\n)```(\w+)?\n([\s\S]*?)```/g, "\n```$1\n$2```");
};
