import { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import type { ConversationDbItem } from "@shared/db.schema";
import { useEffect } from "react";
import { useApiUrl } from "~/root";
import { cn } from "~/shadcn/utils";
import { DynamicMessageInput } from "~/toolkit/ai/ui/DynamicMessageInput";
import { useLLMEventsChat } from "~/toolkit/ai/ui/useLLMEventsChat";
import { CopyToClipboardButton } from "~/toolkit/components/buttons/CopyToClipboardButton";
import { Markdown } from "~/toolkit/components/Markdown/Markdown";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import {
  useProjectContext,
  useSelectedFilesContext,
} from "../projects.$id/route";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  let conversation = await proxyApiRequestAsJson<ConversationDbItem | null>(
    request,
    `/projects/${params.id}/conversations/${params.conversationId}`
  );
  console.log("🚀 | loader | conversation:", conversation);
  return { conversation };
};

function useProjectChat(
  conversation: SerializeFrom<ConversationDbItem | null>
) {
  const { id: projectId, conversationId } = useParams();
  const { selectedFiles, setSelectedFiles } = useSelectedFilesContext();
  const apiUrl = useApiUrl();
  const apiPath = `${apiUrl}/projects/${projectId}/chat/${conversationId}`;
  const { actions, messages, isStreaming, inputRef } = useLLMEventsChat({
    apiPath,
    initialMessages: (conversation?.messages as any[]) || [],
    bodyInput: { projectId, conversationId },
  });
  let lastMessageDataEvents = messages[messages.length - 1]?.data || [];
  let lastSelectedFiles =
    (
      lastMessageDataEvents.find(
        (event: any) => event.type === "selectedFiles"
      ) as any
    )?.selectedFiles ||
    conversation?.messages?.[conversation.messages.length - 1]?.selectedFiles ||
    [];

  useEffect(() => {
    if (lastSelectedFiles?.length) {
      setSelectedFiles(lastSelectedFiles, Date.now().toString());
    }
  }, [lastSelectedFiles]);

  return {
    actions: {
      ...actions,
      submit: (input: string) => actions.submit(input, { selectedFiles }),
    },
    messages,
    isStreaming,
    inputRef,
  };
}

export default function ChatConversationRoute() {
  const { conversation } = useLoaderData<typeof loader>();
  const { actions, messages, isStreaming, inputRef } =
    useProjectChat(conversation);
  let { project } = useProjectContext();

  return (
    <div
      className={cn(
        "w-full transition-colors duration-300",
        messages && messages?.length > 1 ? "bg-gray-100" : "bg-white"
      )}
    >
      <div className="w-full relative grid grid-rows-[1fr_auto] max-w-4xl mx-auto ">
        {/* <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Button onClick={startNewChat}>Start New Chat</Button>
      </div> */}
        <div className="p-4 space-y-4 min-h-44">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <strong className="mr-4 mt-6">AI</strong>
              )}
              <div
                className={`p-6 rounded-lg border ${
                  message.role === "user"
                    ? "bg-gray-800 text-white"
                    : "bg-white"
                }`}
              >
                <Markdown
                  id={"message" + index}
                  className={cn(
                    "prose-base",
                    message.role === "user" ? "text-white" : ""
                  )}
                >
                  {message.content || ""}
                </Markdown>
                <div className="actions flex justify-center items-center">
                  {message.role === "assistant" && (
                    <CopyToClipboardButton
                      plainText={message.content}
                      elementId={"message" + index}
                    />
                  )}
                </div>
              </div>
              {message.role === "user" && (
                <strong className="ml-4 mt-6">ME</strong>
              )}
            </div>
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
            ref={inputRef}
            handleSubmit={(input) => actions.submit(input)}
            placeholder="Ask about the code..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
