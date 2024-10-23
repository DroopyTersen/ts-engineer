import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import type { ConversationDbItem } from "@shared/db.schema";
import { LuArrowDown } from "react-icons/lu";
import { Button } from "~/shadcn/components/ui/button";
import { cn } from "~/shadcn/utils";
import { DynamicMessageInput } from "~/toolkit/ai/ui/DynamicMessageInput";
import { useScrollToBottom } from "~/toolkit/ai/ui/useScrollToBottom";
import { useUpdateEffect } from "~/toolkit/hooks/useUpdateEffect";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { useProjectContext } from "../projects.$id/route";
import { EditableMessage } from "./EditableMessage";
import { useProjectChat } from "./useProjectChat";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  let conversation = await proxyApiRequestAsJson<ConversationDbItem | null>(
    request,
    `/projects/${params.id}/conversations/${params.conversationId}`
  );
  return { conversation };
};

export default function ChatRoute() {
  const params = useParams();
  const { conversation } = useLoaderData<typeof loader>();
  const { actions, messages, isStreaming, inputRef } =
    useProjectChat(conversation);
  let { project } = useProjectContext();
  let { scrollToBottom, isAtBottom } = useScrollToBottom(
    isStreaming,
    "#project-scroll-container"
  );
  useUpdateEffect(() => {
    if (
      messages.length > 0 &&
      messages.length > (conversation?.messages?.length || 0)
    ) {
      scrollToBottom();
    }
  }, [messages.length]);

  return (
    <div
      className={cn(
        "w-full transition-colors duration-300",
        messages && messages?.length > 1 ? "bg-gray-100" : "bg-white"
      )}
    >
      <div className="w-full relative grid grid-rows-[1fr_auto] max-w-4xl mx-auto ">
        <div className="p-4 space-y-4 min-h-44">
          {messages.map((message, index) => (
            <EditableMessage
              key={index}
              index={index}
              editMessage={actions.editMessage}
              message={message}
              isStreaming={isStreaming}
            />
          ))}
        </div>
        <div className={"py-8 sticky bottom-0 w-full"}>
          {messages?.length === 0 && (
            <p className="text-xl text-center font-semibold mb-6 text-gray-500">
              Ask a question about the{" "}
              <span className="font-extrabold">{project.name}</span>
            </p>
          )}
          {isStreaming && (
            <div className="text-gray-900 font-bold uppercase mb-2 text-center font-mono animate-pulse ">
              ...AI is responding...
            </div>
          )}
          <DynamicMessageInput
            className="shadow-lg max-w-4xl"
            // ref={inputRef}
            handleSubmit={(input) => actions.submit(input, {})}
            placeholder="Ask about the code..."
            autoFocus
          />
        </div>
      </div>
      <Button
        className={cn(
          "fixed bottom-8 right-8 rounded-full transition-opacity duration-500 shadow-lg",
          isAtBottom ? "opacity-0" : "opacity-100",
          isStreaming ? "animate-bounce" : ""
        )}
        size={"icon"}
        onClick={() => scrollToBottom()}
      >
        <LuArrowDown size={20} />
      </Button>
    </div>
  );
}
