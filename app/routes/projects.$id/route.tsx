import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { useEffect, useState } from "react";
import { useApiUrl } from "~/root";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/shadcn/components/ui/resizable";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";
import { FolderExplorer } from "~/toolkit/components/FileExplorer/FolderExplorer";
import { jsonRequest } from "~/toolkit/http/fetch.utils";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { formatNumber } from "~/toolkit/utils/formatNumber";
import { ProjectHeader } from "./ProjectHeader";

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
  const [selectedFiles, setSelectedFiles] = useState<string[]>(
    project.filepaths || []
  );
  let [tokenCount, setTokenCount] = useState<number | null>(null);
  let apiUrl = useApiUrl();
  useEffect(() => {
    jsonRequest(apiUrl + `/projects/${project.id}/selection-usage`, {
      method: "POST",
      body: JSON.stringify({
        selectedFiles: selectedFiles,
      }),
    }).then((usage) => setTokenCount(usage.usageEstimate?.tokens));
  }, [selectedFiles.join(",")]);
  return { selectedFiles, setSelectedFiles, tokenCount };
}

export default function ProjectDetailsRoute() {
  let data = useLoaderData<typeof loader>();
  let project = data?.project;
  const { selectedFiles, setSelectedFiles, tokenCount } =
    useSelectedFiles(project);

  if (!project) {
    return <div>Project not found</div>;
  }
  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
      <ProjectHeader project={project} />
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="px-4 py-4">
            {selectedFiles.length} Selected Files{" "}
            {formatNumber(tokenCount || 0)} tokens
          </div>
          <ScrollArea type="auto" className=" h-full px-4 py-4">
            <FolderExplorer
              files={project.filepaths || []}
              onSelection={setSelectedFiles}
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="overflow-y-auto h-full">
            <Outlet context={{ project, selectedFiles }} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
