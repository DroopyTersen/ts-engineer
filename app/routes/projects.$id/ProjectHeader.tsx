import { Form, Link } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { BsPencil } from "react-icons/bs";
import { ChevronRightIcon, SearchIcon } from "~/shadcn/components/icons";
import { Button } from "~/shadcn/components/ui/button";
import { Input } from "~/shadcn/components/ui/input";
import { OpenInCursorButton } from "./OpenInCursorButton";

export function ProjectHeader({ project }: { project: CodeProject }) {
  return (
    <header className="bg-background w-full flex items-center justify-between px-4 md:px-6 h-16 shadow">
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          Projects
        </Link>
        <div className="flex items-center gap-2">
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Link to="edit">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full"
              >
                <Link to="edit">
                  <BsPencil />
                </Link>
              </Button>
            </Link>
          </div>
          <div className="flex flex-col ml-12">
            <OpenInCursorButton
              projectId={project.id}
              absolutePath={project.absolute_path}
            />
            <span className="font-mono text-sm pl-2">
              {project.filepaths?.length || 0} files •{" "}
              {project.usageEstimate?.tokens
                ? `${(project.usageEstimate.tokens / 1000).toFixed(1)}k tokens`
                : ""}
            </span>
          </div>
        </div>
      </div>
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-2 flex items-center justify-center">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <Form action="/search" method="GET">
          <Input
            name="query"
            type="search"
            placeholder="Search everything..."
            className="w-full rounded-md bg-background pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </Form>
      </div>
    </header>
  );
}
