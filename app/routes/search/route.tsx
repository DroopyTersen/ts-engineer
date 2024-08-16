import { ScrollArea } from "@radix-ui/react-scroll-area";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import type { SearchFilesResponse } from "api/aiEngineer/db/files.db";
import { ChevronRightIcon, SearchIcon } from "~/shadcn/components/icons";
import { Input } from "~/shadcn/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/shadcn/components/ui/resizable";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let searchData = await proxyApiRequestAsJson<SearchFilesResponse>(request);

  return {
    ...searchData,
  };
};

export default function SearchRoute() {
  const { results } = useLoaderData<typeof loader>();
  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
      <SearchPageHeader />
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <ScrollArea type="auto" className=" h-full px-4 py-4">
            <div>Refiners will go here</div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="overflow-y-auto h-full">{}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function SearchPageHeader() {
  return (
    <header className="bg-background w-full flex items-center justify-between px-4 md:px-6 h-16 shadow">
      <div className="flex items-center gap-4">
        {/* <span className="text-sm font-medium">AI Code</span> */}
        <Link to="/">
          <img src="/logo.svg" alt="AI Code" className="h-12 w-12" />
        </Link>
        <div className="flex items-center gap-2">
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Global Search</h1>
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
