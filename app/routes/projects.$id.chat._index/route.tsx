import { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import type { GetConversationsResult } from "api/aiEngineer/api/chat/getConversations";
import { Button } from "~/shadcn/components/ui/button";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { generateId } from "~/toolkit/utils/generateId";
import { ConversationsTable } from "./ConversationsTable";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const conversations = (await proxyApiRequestAsJson(
    request,
    `/projects/${params.id}/conversations`
  )) as SerializeFrom<GetConversationsResult>;
  return {
    conversations,
  };
};

export default function ChatRoute() {
  const { id: projectId } = useParams();
  const { conversations } = useLoaderData<typeof loader>();
  const nextId = generateId(8);

  return (
    <div className="p-4">
      {conversations.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Conversations</h1>
            <Button asChild>
              <Link to={nextId}>Start New Conversation</Link>
            </Button>
          </div>
          <ConversationsTable
            conversations={conversations}
            projectId={projectId!}
          />
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-semibold mb-4">No Conversations Yet!</p>
          <Button asChild>
            <Link to={nextId}>Start your first conversation</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
