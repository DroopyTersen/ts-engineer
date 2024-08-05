import Markdown from "markdown-to-jsx";
import React from "react";
import { CopyToClipboardButton } from "~/toolkit/components/buttons/CopyToClipboardButton";
import { Spinner } from "~/toolkit/components/loaders/LoadingSpinner";
import { cn, tw } from "~/toolkit/components/utils";
import { LooseAutocomplete } from "~/toolkit/utils/typescript.utils";
import { ToolUse } from "../streams/LLMDataStream";
import { Logo } from "~/layout/components/Logo";

function AIAvatar() {
  return (
    <Logo className="w-7 h-7 text-primary/80" />
    // <MessageAvatar role={"assistant"}>
    //   <span>AI</span>
    // </MessageAvatar>
  );
}

function UserAvatar() {
  return (
    <MessageAvatar role={"user"}>
      <span>ME</span>
    </MessageAvatar>
  );
}

export type ChatMessageProps = {
  role: LooseAutocomplete<"assistant" | "user" | "tool">;
  children: React.ReactNode | React.ReactNode[] | string;
  isStreaming?: boolean;
  markdownToCopy?: string;
};

export function ChatMessage({
  children,
  isStreaming = false,
  markdownToCopy = "",
  role,
}: ChatMessageProps) {
  if (role === "assistant") {
    return (
      <AIMessageBox markdownToCopy={markdownToCopy} isStreaming={isStreaming}>
        {typeof children === "string" ? (
          <ChatMessageMarkdown>{children}</ChatMessageMarkdown>
        ) : (
          children
        )}
      </AIMessageBox>
    );
  }
  return (
    <ChatMessageContainer className="border">
      <UserAvatar />
      <div className="flex max-w-3xl items-center">{children}</div>
    </ChatMessageContainer>
  );
}

export function ChatToolUseDebug({
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
    <div className={cn("prose prose-sm", className)}>
      {toolUses.map((toolUse: any, index: number) => (
        <details key={index} className="mb-2">
          <summary>Tool: {toolUse.name}</summary>
          <pre className="text-wrap">{JSON.stringify(toolUse, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}

export function ChatMessageLogs({ logs }: { logs: string[] }) {
  if (!logs || logs.length === 0) {
    return null;
  }
  return (
    <div className="prose prose-sm">
      <pre
        className="text-xs bg-neutral text-accent-content rounded p-4 mb-6 whitespace-pre-wrap"
        style={{ textWrap: "wrap", width: "100%" } as any}
      >
        {logs.map((m) => `> ${m}`).join("\n")}
      </pre>
    </div>
  );
}

export function ChatMessageMarkdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm whitespace-pre-wrap [&>*>*:first-child]:mt-2 ",
        className
      )}
    >
      <Markdown>{children}</Markdown>
    </div>
  );
}

function AIMessageBox({
  children,
  isStreaming,
  markdownToCopy,
}: {
  children: React.ReactNode;
  isStreaming: boolean;
  markdownToCopy: string;
}) {
  return (
    <ChatMessageContainer className="bg-base-200">
      <AIAvatar />
      <div className="w-full flex flex-col gap-2">
        {children}

        <div className="flex justify-center">
          {!isStreaming && (
            <CopyToClipboardButton
              markdown={markdownToCopy}
              className="opacity-80 hover:opacity-100 btn-sm"
            />
          )}
        </div>
      </div>
      <div className="flex gap-4"></div>
    </ChatMessageContainer>
  );
}

const ChatMessageContainer = tw(
  "div",
  "relative flex gap-4 rounded-xl px-2 py-6 sm:px-4 w-full chat-message max-w-3xl mx-auto"
);

function MessageAvatar({
  children,
  role,
}: {
  role: string;
  children: React.ReactNode;
}) {
  let bgColor = role === "assistant" ? "bg-neutral" : "bg-primary/10";
  let textColor = role === "assistant" ? "text-white" : "text-primary";

  return (
    <div className="avatar placeholder">
      <div className={`w-10 h-10 rounded-full ${bgColor} ${textColor}`}>
        {children}
      </div>
    </div>
  );
}
