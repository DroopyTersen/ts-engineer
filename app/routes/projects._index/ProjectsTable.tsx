import { Link } from "@remix-run/react";
import { ProjectListItem } from "api/aiEngineer/api/getProjects.api";
import dayjs from "dayjs";
import { useState } from "react";
import { IoWarningOutline } from "react-icons/io5";
import { useApiUrl } from "~/root";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from "~/shadcn/components/icons";
import { Badge } from "~/shadcn/components/ui/badge";
import { Button } from "~/shadcn/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shadcn/components/ui/table";
import { cn } from "~/shadcn/utils";
import { useSorting } from "~/toolkit/hooks/useSorting";
import { OpenInCursorButton } from "../projects.$id/OpenInCursorButton";

export function ProjectsTable({ projects }: { projects: ProjectListItem[] }) {
  let apiUrl = useApiUrl();
  let [indexingProjectId, setIndexingProjectId] = useState("");

  const { sortedItems, onSort, sortKey, sortDir } = useSorting(projects, {
    sortKey: "lastUpdate.updatedAt", // Default sort by last update
    sortDir: "DESC", // Default to most recent first
  });

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey)
      return <ArrowUpDownIcon className="w-4 h-4 ml-1" />;
    return sortDir === "ASC" ? (
      <ArrowUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 ml-1" />
    );
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">No matching projects found</p>
      </div>
    );
  }

  const indexProject = async (projectId: string) => {
    setIndexingProjectId(projectId);
    await fetch(apiUrl + `/projects/${projectId}/reindex`);
    setIndexingProjectId("");
  };

  return (
    <Table className="text-base">
      <TableHeader>
        <TableRow>
          <TableHead
            onClick={() => onSort("name")}
            className={cn(
              "cursor-pointer select-none",
              sortKey === "name" && "text-primary"
            )}
            aria-sort={
              sortKey === "name"
                ? sortDir === "ASC"
                  ? "ascending"
                  : "descending"
                : "none"
            }
          >
            <div className="flex items-center">
              Project
              {getSortIcon("name")}
            </div>
          </TableHead>
          <TableHead
            onClick={() => onSort("lastUpdate.updatedAt")}
            className={cn(
              "cursor-pointer select-none",
              sortKey === "lastUpdate.updatedAt" && "text-primary"
            )}
            aria-sort={
              sortKey === "lastUpdate.updatedAt"
                ? sortDir === "ASC"
                  ? "ascending"
                  : "descending"
                : "none"
            }
          >
            <div className="flex items-center">
              Updated
              {getSortIcon("lastUpdate.updatedAt")}
            </div>
          </TableHead>
          <TableHead>GIT Status</TableHead>
          <TableHead>Classification</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">
              <div>
                <Link
                  className="text-lg hover:underline py-2"
                  to={`/projects/${project.id}`}
                >
                  {project.name}
                </Link>
              </div>
              <OpenInCursorButton
                className="text-sm -ml-2 mt-2"
                projectId={project.id}
                absolutePath={project.absolute_path}
              />
            </TableCell>
            <TableCell>
              <div>
                <div className="text-sm text-gray-500 font-medium">
                  {dayjs(project.lastUpdate?.updatedAt).format("MMM D, YYYY")}
                </div>
                <div className="font-mono text-sm">
                  {project.lastUpdate?.filepath?.split("/").pop()}
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex flex-col gap-2 text-sm font-mono bg-gray-100 rounded-md p-2">
                <div className="flex gap-2 font-normal text-gray-800">
                  {project.branch}
                </div>
                {project?.uncommittedChangesCount > 0 && (
                  <div className="flex gap-2 text-red-700 ml-2">
                    <IoWarningOutline className="h-4 w-4" />
                    {project?.uncommittedChangesCount} Uncommitted
                  </div>
                )}
                {project?.unstagedChangesCount > 0 ? (
                  <div className="flex gap-2 text-gray-500 ml-2">
                    <IoWarningOutline className="h-4 w-4" />
                    {project?.unstagedChangesCount} Unstaged
                  </div>
                ) : (
                  ""
                )}
              </div>
            </TableCell>

            <TableCell>
              <Badge
                className={cn(
                  "uppercase",
                  project.classification === "public" &&
                    "text-white bg-emerald-600",
                  project.classification === "private" &&
                    "text-white bg-cyan-600",
                  project.classification === "work" && "text-white bg-rose-700"
                )}
              >
                {project.classification}
              </Badge>
            </TableCell>

            <TableCell className="text-right">
              <div className="flex flex-col justify-end gap-1">
                <Button variant={"outline"} size="sm" asChild>
                  <Link to={`/projects/${project.id}/edit`}>Edit</Link>
                </Button>
                <Button
                  disabled={!!indexingProjectId}
                  onClick={() => indexProject(project.id)}
                  variant="outline"
                  size="sm"
                >
                  {indexingProjectId === project.id ? "Indexing..." : "Reindex"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
