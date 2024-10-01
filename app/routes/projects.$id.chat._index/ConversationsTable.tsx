import { SerializeFrom } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { useApiUrl } from "~/root";
import { Button } from "~/shadcn/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shadcn/components/ui/table";

interface ConversationsTableProps {
  conversations: SerializeFrom<
    Array<{
      id: string;
      title: string | null;
      created_at: string;
    }>
  >;
  projectId: string;
}

export function ConversationsTable({
  conversations,
  projectId,
}: ConversationsTableProps) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const apiUrl = useApiUrl();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const apiPath = `${apiUrl}/projects/${projectId}/conversations/${id}`;

    try {
      const response = await fetch(apiPath, {
        method: "DELETE",
      });
      if (response.ok) {
        navigate(".", { replace: true });
      } else {
        console.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
    setDeletingId(null);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conversations.map((conversation) => (
          <TableRow key={conversation.id}>
            <TableCell>
              <Link
                to={conversation.id}
                className="text-blue-600 hover:underline"
              >
                {conversation.title || "Untitled"}
              </Link>
            </TableCell>
            <TableCell>
              {new Date(conversation.created_at).toLocaleString()}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(conversation.id)}
                disabled={deletingId === conversation.id}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
