import { Label } from "@radix-ui/react-label";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { CodeProjectDbItem } from "@shared/db.schema";
import { ChevronRightIcon, SearchIcon } from "~/shadcn/components/icons";
import { Button } from "~/shadcn/components/ui/button.js";
import { Input } from "~/shadcn/components/ui/input.js";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest.js";

export const action = async ({ request }: ActionFunctionArgs) => {
  let resp = await proxyApiRequest(request);
  let newProject = (await resp.json()) as CodeProjectDbItem;
  return redirect("/projects/" + newProject.id);
};
export default function NewProject() {
  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
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
            <h1 className="text-2xl font-bold">New Project</h1>
            <div className="flex flex-col ml-12">
              {/* <Button asChild>
                <Link to="/projects/new">Create new project</Link>
              </Button> */}
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
        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="text-4xl font-bold">Add a new Project</h1>
          <Form method="POST">
            <div className="grid gap-3 mt-6">
              <Label htmlFor="absolutePath">Absolute Path</Label>
              <Input required name="absolutePath" id="absolutePath" />
              <p className="text-xs text-slate-500" data-description>
                The absolute path to the project's root directory.
              </p>
            </div>
            <div className="grid gap-3 mt-6">
              <Label htmlFor="name">Name</Label>
              <Input name="name" id="name" />
              <p className="text-xs text-slate-500" data-description>
                The name of your project. If left blank, the last segment of the
                absolute path will be used.
              </p>
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <Button variant="secondary" asChild className="w-40">
                <Link to="/projects">Cancel</Link>
              </Button>
              <Button type="submit" size={"lg"} className="w-40">
                Add
              </Button>
            </div>
          </Form>
        </div>
      </ScrollArea>
    </div>
  );
}
