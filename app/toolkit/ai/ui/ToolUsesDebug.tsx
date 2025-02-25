import { cn } from "~/shadcn/utils";
import type { ToolUse } from "../streams/LLMDataStream";

export function ChatToolUsesDebug({
  toolUses,
  className = "",
}: {
  toolUses: ToolUse[];
  className?: string;
}) {
  if (!toolUses || toolUses.length === 0) {
    return null;
  }
  return (
    <div className={cn("prose prose-sm max-w-4xl", className)}>
      {toolUses.map((toolUse: any, index: number) => (
        <details key={index} className="mb-2">
          <summary>
            Tool: <span className="font-mono">{toolUse.name}</span>
          </summary>
          <pre className="text-wrap">{JSON.stringify(toolUse, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}
