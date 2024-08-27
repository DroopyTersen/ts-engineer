import { Form, Link } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { BsPencil } from "react-icons/bs";
import { ChevronRightIcon, SearchIcon } from "~/shadcn/components/icons";
import { Button } from "~/shadcn/components/ui/button";
import { Input } from "~/shadcn/components/ui/input";
import { formatNumber } from "~/toolkit/utils/formatNumber";
import { OpenInCursorButton } from "./OpenInCursorButton";

export function ProjectHeader({ project }: { project: CodeProject }) {
  return (
    <header className="bg-background w-full flex items-center justify-between px-4 md:px-6 h-16 shadow">
      <div className="flex items-center gap-4">
        <Link to="/">
          <img src="/logo.svg" alt="AI Code" className="h-12 w-12" />
        </Link>
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />

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
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="edit">
                <BsPencil />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col ml-12">
            <OpenInCursorButton
              projectId={project.id}
              absolutePath={project.absolute_path}
            />
            <span className="font-mono text-sm pl-2">
              {project.filepaths?.length || 0} files •{" "}
              {project.usageEstimate?.tokens
                ? `${formatNumber(project.usageEstimate.tokens)} tokens`
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
