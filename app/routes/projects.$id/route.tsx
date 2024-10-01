import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { useCallback, useEffect, useState } from "react";
import { useApiUrl } from "~/root";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/shadcn/components/ui/resizable";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";

import { Link } from "@remix-run/react";
import { BsMarkdown } from "react-icons/bs";
import { Button } from "~/shadcn/components/ui/button";
import { FileExplorer } from "~/toolkit/components/FileExplorer/FileExplorer";
import { jsonRequest } from "~/toolkit/http/fetch.utils";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { useIsHydrated } from "~/toolkit/remix/useIsHydrated";
import { formatNumber } from "~/toolkit/utils/formatNumber";
import { ProjectHeader } from "./ProjectHeader";
import ProjectTabs from "./ProjectTabs";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   let resp = await proxyApiRequest(request);
//   return resp;
// };

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const project = await proxyApiRequestAsJson<CodeProject>(
    request,
    `/projects/${params.id}`
  );
  return {
    project,
  };
};

function useSelectedFiles(project: CodeProject) {
  const [selectedFiles, _setSelectedFiles] = useState<string[]>([]);
  const [selectionKey, setSelectionKey] = useState("manual");
  let [tokenCount, setTokenCount] = useState<number | null>(null);
  let apiUrl = useApiUrl();
  const setSelectedFiles = useCallback(
    (selectedFiles: string[], selectionKey?: string) => {
      _setSelectedFiles(selectedFiles);
      if (selectionKey) {
        setSelectionKey(selectionKey);
      }
    },
    [_setSelectedFiles, setSelectionKey]
  );
  useEffect(() => {
    if (selectedFiles.length > 0) {
      jsonRequest(apiUrl + `/projects/${project.id}/selection-usage`, {
        method: "POST",
        body: JSON.stringify({
          selectedFiles: selectedFiles,
        }),
      }).then((usage) => setTokenCount(usage.usageEstimate?.tokens));
    } else {
      setTokenCount(0);
    }
  }, [selectedFiles.join(",")]);
  return { selectedFiles, setSelectedFiles, tokenCount, selectionKey };
}

export default function ProjectRoute() {
  let data = useLoaderData<typeof loader>();
  let project = data?.project;
  const { selectedFiles, setSelectedFiles, tokenCount, selectionKey } =
    useSelectedFiles(project);
  let isHydrated = useIsHydrated();
  if (!isHydrated) {
    return null;
  }
  if (!project) {
    return <div>Project not found</div>;
  }
  const showMarkdownButton = selectedFiles.length > 0;

  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
      <ProjectHeader project={project} />
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <ScrollArea type="auto" className=" h-full px-4 py-4">
            <div className="px-4 sticky top-0 bg-white z-10 text-sm text-gray-500 flex justify-between items-center">
              <span>
                {selectedFiles.length} Selected Files{" "}
                {formatNumber(tokenCount || 0)} tokens
              </span>
              {showMarkdownButton && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/projects/${project.id}/markdown`}>
                    <BsMarkdown className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <FileExplorer
              key={selectionKey}
              files={project.filepaths || []}
              selectedFiles={selectedFiles}
              onSelection={setSelectedFiles}
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="overflow-y-auto h-full">
            <ProjectTabs projectId={project.id} selectedFiles={selectedFiles} />
            <Outlet context={{ project, selectedFiles, setSelectedFiles }} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export function useSelectedFilesContext() {
  let { selectedFiles, setSelectedFiles } = useOutletContext<{
    selectedFiles: string[];
    setSelectedFiles: (selectedFiles: string[], selectionKey?: string) => void;
  }>();
  return { selectedFiles, setSelectedFiles };
}

export function useProjectContext() {
  let { project } = useOutletContext<{
    project: CodeProject;
  }>();
  return { project };
}
