import { useRef, useState } from "react";
import { cn } from "~/shadcn/utils";
import type { ToolUse } from "../streams/LLMDataStream";

// Component for individual tool use
const ToolUseItem = ({
  toolUse,
  defaultOpen = false,
}: {
  toolUse: any;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleToggle = () => {
    if (detailsRef.current) {
      setIsOpen(detailsRef.current.open);
    }
  };

  return (
    <details
      ref={detailsRef}
      open={isOpen}
      onToggle={handleToggle}
      className="mb-4 mt-0 border-l-2 border-base-300/80"
    >
      <summary className="py-2 pl-4 text-sm font-medium cursor-pointer hover:bg-base-200">
        Tool: <span className="font-mono">{toolUse.name}</span>
      </summary>
      <div className="pl-4 pr-4 pb-2 max-h-96 overflow-auto">
        <pre className="text-wrap text-xs mt-1 bg-base-100/50 p-2 rounded">
          {JSON.stringify(toolUse, null, 2)}
        </pre>
      </div>
    </details>
  );
};

export function ChatToolUsesDebug({
  toolUses,
  className = "",
  defaultOpen = false,
}: {
  toolUses: ToolUse[];
  className?: string;
  defaultOpen?: boolean;
}) {
  if (!toolUses || toolUses.length === 0) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      {toolUses.map((toolUse: any, index: number) => (
        <ToolUseItem key={index} toolUse={toolUse} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}
