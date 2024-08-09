import { useOutletContext } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";

export default function ProjectDetailsRoute() {
  let project = useOutletContext<{ project: CodeProject }>()?.project;
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-4xl font-bold">{project.name}</h1>
      <ProjectStats project={project} />
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
