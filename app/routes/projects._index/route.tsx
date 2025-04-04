import { type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { ProjectListItem } from "api/aiEngineer/api/getProjects.api";
import { ChevronRightIcon, SearchIcon } from "~/shadcn/components/icons";
import { Button } from "~/shadcn/components/ui/button";
import { Input } from "~/shadcn/components/ui/input";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";
import { useFilteredItemsByText } from "~/toolkit/hooks/useFilteredItemsByText";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { ProjectsTable } from "./ProjectsTable";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const projects = await proxyApiRequestAsJson<ProjectListItem[]>(request);
  return {
    projects,
  };
};

export default function ProjectsRoute() {
  const { projects } = useLoaderData<typeof loader>();
  const { filteredItems, setFilterText, filterText } = useFilteredItemsByText(
    projects,
    ["name", "absolute_path"],
    ""
  );

  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
      <header className="bg-background w-full flex items-center justify-between px-4 md:px-6 h-16 shadow">
        <div className="flex items-center gap-4">
          {/* <span className="text-sm font-medium">AI Code</span> */}
          <Link to="/">
            <img src="/logo.svg" alt="AI Code" className="h-12 w-12" />
          </Link>
          <div className="flex items-center gap-2">
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Projects</h1>
            <div className="flex flex-col ml-12">
              <Button asChild>
                <Link to="/projects/new">Create new project</Link>
              </Button>
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
      <ScrollArea>
        <div className="p-4 mt-8 max-w-[1400px] mx-auto">
          <div className="mb-6 flex gap-4 items-center">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-2 flex items-center justify-center">
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="search"
                placeholder="Filter projects..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-8"
                aria-label="Filter projects"
              />
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Showing {filteredItems.length} of {projects.length} projects
            </div>
          </div>
          <ProjectsTable projects={filteredItems} />
        </div>
      </ScrollArea>
    </div>
  );
}
