import { Label } from "@radix-ui/react-label";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { FileSearchResultItem } from "@shared/db.schema";
import type {
  SearchFilesCriteria,
  SearchFilesResponse,
} from "api/aiEngineer/db/files.db";
import { useState } from "react";
import { useApiUrl } from "~/root";
import { ChevronRightIcon, SearchIcon } from "~/shadcn/components/icons";
import { Button } from "~/shadcn/components/ui/button";
import { Card } from "~/shadcn/components/ui/card";
import { Input } from "~/shadcn/components/ui/input";
import { RadioGroupItem } from "~/shadcn/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/shadcn/components/ui/resizable";
import { cn } from "~/shadcn/utils";
import { useLLMEventStream } from "~/toolkit/ai/ui/useLLMEventStream";
import { MyDrawer } from "~/toolkit/components/Drawer/Drawer";
import { Markdown } from "~/toolkit/components/Markdown/Markdown";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { useIsHydrated } from "~/toolkit/remix/useIsHydrated";
import { FileViewer } from "../api.syntax-highlight/FileViewer";
import { CodeSearchResultItem } from "./CodeSearchResultItem";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let searchData = await proxyApiRequestAsJson<SearchFilesResponse>(request);

  return {
    ...searchData,
  };
};

export default function SearchRoute() {
  const { results, criteria, projects } = useLoaderData<typeof loader>();
  console.log("🚀 | SearchRoute | criteria:", criteria);
  let [drawerFileId, setDrawerFileId] = useState("");
  let isHydrated = useIsHydrated();
  let drawerFile = drawerFileId
    ? results.find((result) => result.id === drawerFileId)
    : null;

  const apiUrl = useApiUrl();
  const answerStream = useLLMEventStream<{
    query: string;
    fileIds: string[];
  }>({
    apiPath: `${apiUrl}/search/answer-question`,
    bodyInput: {},
  });

  const handleGenerateAnswer = () => {
    const fileIds = results.map((result) => result.id);
    answerStream.actions.submit({
      query: criteria.query,
      fileIds,
    });
  };

  if (!isHydrated) {
    return null;
  }
  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
      <SearchPageHeader criteria={criteria} />
      <MyDrawer
        isOpen={!!drawerFile}
        onClose={() => setDrawerFileId("")}
        className="px-4 py-4"
      >
        <div className="max-w-5xl w-[1024px]">
          {drawerFile && (
            <FileViewer
              project={drawerFile.project as any}
              filepath={drawerFile.filepath}
              onClose={() => setDrawerFileId("")}
              className="rounded-lg"
            />
          )}
        </div>
      </MyDrawer>
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <ScrollArea type="auto" className=" h-full px-4 py-4">
            <Form action="/search" method="GET" id="search-form">
              <fieldset className="flex flex-col gap-8">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-2 flex items-center justify-center">
                    <SearchIcon className="h-4 w-4 text-gray-300" />
                  </div>
                  <Input
                    name="query"
                    type="search"
                    defaultValue={criteria.query}
                    placeholder="Search everything..."
                    className="w-full rounded-full  bg-background pl-8 pr-4 py-2 text-base focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extension" className="font-medium text-sm">
                    File Extension
                  </Label>
                  <Input
                    id="extension"
                    name="extension"
                    placeholder="e.g., js, tsx, py"
                    defaultValue={criteria.extension}
                    className="w-full text-lg"
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label className="font-medium text-sm">Project</Label>
                  {projects && projects.length > 0 ? (
                    <RadioGroup
                      name="projectId"
                      defaultValue={criteria.projectId}
                      onChange={(e) => {
                        e.currentTarget.closest("form")?.submit();
                      }}
                    >
                      {criteria.projectId && (
                        <div className="flex items-center space-x-2 absolute top-0 right-0">
                          <RadioGroupItem
                            value=""
                            id={`project-all`}
                            checked={criteria.projectId === ""}
                            className="opacity-0"
                          />
                          <Label
                            htmlFor={`project-all`}
                            className="cursor-pointer p-2 hover:bg-gray-100 rounded-md text-sm font-medium"
                          >
                            Show all projects
                          </Label>
                        </div>
                      )}
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center space-x-2 mb-1 text-lg font-medium"
                        >
                          <RadioGroupItem
                            value={project.id}
                            id={`project-${project.id}`}
                          />
                          <Label
                            htmlFor={`project-${project.id}`}
                            className={cn(
                              "cursor-pointer hover:text-gray-900",
                              criteria.projectId &&
                                criteria.projectId !== project.id &&
                                "text-gray-400"
                            )}
                          >
                            {project.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No projects available
                    </p>
                  )}
                </div>
                <div>
                  <Button className="w-full" type="submit">
                    Search
                  </Button>
                </div>
              </fieldset>
            </Form>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="overflow-y-auto h-full pl-4 pt-4">
            <Button
              onClick={handleGenerateAnswer}
              disabled={results.length === 0 || answerStream.isStreaming}
              className="mb-4 w-full max-w-5xl"
            >
              {answerStream.isStreaming
                ? "Generating..."
                : "Generate an Answer"}
            </Button>
            {answerStream.message?.content && (
              <Card className="p-4 mb-4 max-w-5xl bg-gray-100">
                <h3 className="text-lg font-semibold mb-2">
                  Generated Answer:
                </h3>
                <Markdown>{answerStream.message.content}</Markdown>
              </Card>
            )}
            <CodeSearchResults results={results} viewFile={setDrawerFileId} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function CodeSearchResults({
  results,
  viewFile,
}: {
  results: SerializeFrom<FileSearchResultItem>[];
  viewFile: (filepath: string) => void;
}) {
  if (results.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No search results found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {results.map((item) => (
        <CodeSearchResultItem key={item.id} item={item} viewFile={viewFile} />
      ))}
    </div>
  );
}

function SearchPageHeader({ criteria }: { criteria: SearchFilesCriteria }) {
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
    </header>
  );
}
