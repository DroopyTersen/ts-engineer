import { SerializeFrom } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import type { ConversationDbItem } from "@shared/db.schema";
import { useEffect } from "react";
import { useApiUrl } from "~/root";
import { useLLMEventsChat } from "~/toolkit/ai/ui/useLLMEventsChat";
import { jsonRequest } from "~/toolkit/http/fetch.utils";
import { useSelectedFilesContext } from "../projects.$id/route";

export function useProjectChat(
  conversation: SerializeFrom<ConversationDbItem | null>
) {
  const { id: projectId, conversationId } = useParams();
  const { selectedFiles, setSelectedFiles } = useSelectedFilesContext();
  const apiUrl = useApiUrl();
  const apiPath = `${apiUrl}/projects/${projectId}/chat/${conversationId}`;
  const { actions, messages, isStreaming, inputRef, setMessages } =
    useLLMEventsChat({
      apiPath,
      initialMessages: (conversation?.messages as any[]) || [],
      bodyInput: { projectId, conversationId, selectedFiles },
      onFinish: async (messages) => {
        await jsonRequest(
          `${apiUrl}/projects/${projectId}/conversations/${conversationId}`,
          {
            method: "POST",
            body: JSON.stringify({
              messages: messages,
              selectedFiles: selectedFiles,
            }),
          }
        );
      },
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
    actions,
    setMessages,
    messages,
    isStreaming,
    inputRef,
  };
}
