import { SerializeFrom } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import { type CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
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

interface CodeTasksTableProps {
  codeTasks: SerializeFrom<CodeTaskDbItem[]>;
  projectId: string;
}

export function CodeTasksTable({ codeTasks, projectId }: CodeTasksTableProps) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  let apiUrl = useApiUrl();
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    let apiPath = `${apiUrl}/projects/${projectId}/codeTasks/${id}`;

    try {
      const response = await fetch(apiPath, {
        method: "DELETE",
      });
      if (response.ok) {
        // Refresh the page or update the state to remove the deleted task
        navigate(`..`, { replace: true });
      } else {
        console.error("Failed to delete code task");
      }
    } catch (error) {
      console.error("Error deleting code task:", error);
    }
    setDeletingId(null);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">ID</TableHead>
          <TableHead className="w-[30%]">Title</TableHead>
          <TableHead className="w-[35%]">Input</TableHead>
          <TableHead className="w-[15%]">Created At</TableHead>
          <TableHead className="w-[10%]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codeTasks.map((codeTask) => (
          <TableRow key={codeTask.id}>
            <TableCell>
              <Link to={codeTask.id} className="text-blue-600 hover:underline">
                {codeTask.id}
              </Link>
            </TableCell>
            <TableCell className="font-medium">
              {codeTask.title || "Untitled"}
            </TableCell>
            <TableCell>
              <p className="line-clamp-3">{codeTask.input.substring(0, 500)}</p>
            </TableCell>
            <TableCell>
              {new Date(codeTask.created_at).toLocaleString()}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(codeTask.id)}
                disabled={deletingId === codeTask.id}
              >
                {deletingId === codeTask.id ? "Deleting..." : "Delete"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
