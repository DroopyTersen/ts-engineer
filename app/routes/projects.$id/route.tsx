import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import Markdown from "markdown-to-jsx";
import { useApiUrl } from "~/root";
import { Button } from "~/shadcn/components/ui/button";
import { useLLMEventStream } from "~/toolkit/ai/ui/useLLMEventStream";
import { FolderExplorer } from "~/toolkit/components/FileExplorer/FolderExplorer";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { ProjectLayout } from "./ProjectLayout";

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
  let { summarize, summary } = useProjectSummary(project);
  if (!project) {
    return <div>Project not found</div>;
  }
  return (
    <ProjectLayout project={project}>
      <div className="max-w-3xl mx-auto mt-8">
        <h1 className="text-4xl font-bold">{project.name}</h1>
        <ProjectStats project={project} />
        <FolderExplorer files={project.filepaths || []} />
        {project.summary && (
          <div className="prose prose-sm max-w-[1200px]">
            <Markdown>{summary}</Markdown>
          </div>
        )}
        <div className="mt-8">
          <Button onClick={summarize}>Generate Summary</Button>
        </div>
      </div>
    </ProjectLayout>
  );
}

function useProjectSummary(project: CodeProject) {
  let apiUrl = useApiUrl();
  let { actions, status, isStreaming, message } = useLLMEventStream({
    bodyInput: {},
    apiPath: apiUrl + `/projects/${project.id}/summarize`,
  });

  let summarize = async () => {
    actions.submit("Please summarize this project");
  };

  return {
    summarize,
    isStreaming,
    summary: isStreaming
      ? message?.content || ""
      : message?.content || project?.summary || "",
  };
}

function useProjectCodeMap(project: CodeProject) {
  let apiUrl = useApiUrl();

  let { actions, status, isStreaming, message } = useLLMEventStream({
    bodyInput: {},
    apiPath: apiUrl + `/projects/${project.id}/code-map`,
  });

  return {
    isStreaming,
    codeMap: isStreaming
      ? message?.content || ""
      : message?.content ||
        project?.files
          .map((f) => `${f.filepath}\n${f.documentation}`)
          .join("\n\n") ||
        "",
  };
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
