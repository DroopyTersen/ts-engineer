import { Send } from "lucide-react";
import React, { useRef, useState } from "react";
import { BsPencil, BsX } from "react-icons/bs";
import { LuSave } from "react-icons/lu";
import { Button } from "~/shadcn/components/ui/button";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { cn, tw } from "~/shadcn/utils";
import { LLMDataMessage } from "~/toolkit/ai/streams/LLMDataStream";
import { CopyToClipboardButton } from "~/toolkit/components/buttons/CopyToClipboardButton";
import { Markdown } from "~/toolkit/components/Markdown/Markdown";
import { ReasoningDisplay } from "./ReasoningDisplay";
import { ChatToolUsesDebug } from "./ToolUsesDebug";

interface ChatMessageProps {
  message: LLMDataMessage;
  editMessage: (index: number, newContents: string) => void;
  isStreaming?: boolean;
  index?: number;
}

const ChatMessageContainer = tw("div", "relative w-full");
const ChatMessageContent = tw(
  "div",
  "p-6 rounded-lg border shadow-sm transition-colors duration-200"
);
const StrongLabel = tw("strong", "");

export const EditableMessage = ({
  message,
  editMessage,
  index,
  isStreaming,
}: ChatMessageProps) => {
  const messageId = `message-${message.id || index}`;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "display">("display");

  const toggleMode = () => {
    setMode(mode === "edit" ? "display" : "edit");
  };
  const role = message.role === "user" ? "ME" : "AI";

  const handleSaveEdit = () => {
    const newContents = textAreaRef.current?.value || "";
    if (index !== undefined && newContents !== message.content) {
      editMessage(index, newContents);
    }
    setMode("display");
  };

  if (!message?.content) return null;

  return (
    <ChatMessageContainer
      className={cn(role === "AI" ? "justify-start" : "justify-end", "group")}
    >
      {mode === "display" ? (
        <ChatMessageContent
          className={cn(
            "transition-colors",
            role === "AI" ? "bg-white" : "bg-gray-100 hover:bg-gray-100 "
          )}
        >
          {message?.reasoning && (
            <ReasoningDisplay defaultOpen={isStreaming}>
              <Markdown>{message.reasoning}</Markdown>
            </ReasoningDisplay>
          )}
          {message?.toolUses?.length ? (
            <div className="flex flex-col">
              <ChatToolUsesDebug toolUses={message.toolUses} />
            </div>
          ) : null}
          <Markdown
            id={messageId}
            className={cn(
              "prose-base",
              role === "AI" ? "text-gray-900" : "text-gray-800"
            )}
          >
            {message.content || ""}
          </Markdown>
          {role === "AI" && !isStreaming && (
            <div className="actions flex justify-center items-center">
              <CopyToClipboardButton
                plainText={message.content || ""}
                elementId={messageId}
                className="relative top-4"
              />
            </div>
          )}
        </ChatMessageContent>
      ) : (
        <Textarea
          ref={textAreaRef}
          autoFocus
          disabled={isStreaming}
          defaultValue={message.content}
          className="p-4 rounded-lg text-base resize-y border-gray-200 focus:border-blue-200 focus:ring-blue-200"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSaveEdit();
            }
          }}
          style={{ fieldSizing: "content" } as any}
        />
      )}
      <div
        className={cn(
          "absolute top-0",
          role === "AI" ? "-left-11" : "-right-11"
        )}
      >
        {mode === "display" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className="mt-4 hover:bg-gray-100 transition-colors rounded-full group"
          >
            <StrongLabel className="opacity-100 group-hover:opacity-0">
              {role === "AI" ? "AI" : "ME"}
            </StrongLabel>
            <BsPencil
              size={16}
              className="absolute opacity-0 group-hover:opacity-100"
            />
          </Button>
        ) : (
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="hover:bg-gray-100 transition-colors rounded-full group"
            >
              <BsX size={24} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleSaveEdit()}
              className="transition-colors rounded-full group hover:bg-gray-200"
            >
              {role === "AI" ? <LuSave size={20} /> : <Send size={20} />}
            </Button>
          </div>
        )}
      </div>
    </ChatMessageContainer>
  );
};
