import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/shadcn/components/ui/resizable";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";
import { FolderExplorer } from "~/toolkit/components/FileExplorer/FolderExplorer";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { ProjectHeader } from "./ProjectHeader";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   let resp = await proxyApiRequest(request);
//   return resp;
// };

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const project = await proxyApiRequestAsJson<CodeProject>(request);
  return {
    project,
  };
};
export default function ProjectDetailsRoute() {
  let data = useLoaderData<typeof loader>();
  let project = data?.project;
  let [selectedFiles, setSelectedFiles] = useState<string[]>(
    data.project?.filepaths || []
  );

  if (!project) {
    return <div>Project not found</div>;
  }
  return (
    <div className="grid grid-rows-[70px_1fr] h-screen">
      <ProjectHeader project={project} />
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="px-4 py-4">{selectedFiles.length} Selected Files</div>
          <ScrollArea type="auto" className="bg-gray-100 h-full px-4 py-4">
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

export function ProjectStats({ project }: { project: CodeProject }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2">
      <div className="px-4 py-6 sm:col-span-1 sm:px-0">
        <dt className="text-sm font-medium leading-6 text-gray-900">
          Absolute Path
        </dt>
        <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2 font-mono">
          {project.absolute_path}
        </dd>
      </div>
      <div className="px-4 py-6 sm:col-span-1 sm:px-0">
        <dt className="text-sm font-medium leading-6 text-gray-900">
          Total Files
        </dt>
        <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2  font-mono">
          {project.filepaths?.length || 0}
        </dd>
      </div>
      <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
        <dt className="text-sm font-medium leading-6 text-gray-900">
          Number of Tokens
        </dt>
        <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2  font-mono">
          {project.usageEstimate?.tokens
            ? `${(project.usageEstimate.tokens / 1000).toFixed(1)}k`
            : ""}
        </dd>
      </div>
      <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
        <dt className="text-sm font-medium leading-6 text-gray-900">
          Estimated Cost per Question
        </dt>
        <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2  font-mono">
          ${project.usageEstimate?.cost?.toFixed(4)}
        </dd>
      </div>
    </dl>
  );
}
