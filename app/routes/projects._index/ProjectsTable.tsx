import { Link } from "@remix-run/react";
import { ProjectListItem } from "api/aiEngineer/api/getProjects.api";
import { IoWarningOutline } from "react-icons/io5";
import { Button } from "~/shadcn/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shadcn/components/ui/table";
import { OpenInCursorButton } from "../projects.$id/OpenInCursorButton";

export function ProjectsTable({ projects }: { projects: ProjectListItem[] }) {
  return (
    <Table className="text-base">
      <TableHeader>
        <TableRow>
          <TableHead>Project Name</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>GIT Status</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">
              <Link
                className="text-lg hover:underline"
                to={`/projects/${project.id}`}
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell>
              <OpenInCursorButton
                projectId={project.id}
                absolutePath={project.absolute_path}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2 text-sm font-mono bg-gray-100 rounded-md">
                <div className="flex gap-2 px-2 py-1 font-normal text-gray-800">
                  {project.branch}
                </div>
                {project?.uncommittedChangesCount > 0 && (
                  <div className="flex gap-2 text-red-700">
                    <IoWarningOutline className="h-4 w-4" />
                    {project?.uncommittedChangesCount} Uncommitted
                  </div>
                )}
                {project?.unstagedChangesCount > 0 ? (
                  <div className="flex gap-2 text-gray-500">
                    <IoWarningOutline className="h-4 w-4" />
                    {project?.unstagedChangesCount} Unstaged
                  </div>
                ) : (
                  ""
                )}
              </div>
            </TableCell>

            <TableCell className="text-right">
              <Button variant="destructive" size="sm">
                Remove Project
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
