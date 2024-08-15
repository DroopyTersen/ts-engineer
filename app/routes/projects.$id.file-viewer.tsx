import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { useEffect, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import { HiOutlineExternalLink } from "react-icons/hi";
import { useApiUrl } from "~/root";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest";
import { OpenInCursorButton } from "./projects.$id/OpenInCursorButton";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  let url = new URL(request.url);
  let apiResp = await proxyApiRequest(request);
  let codeHtml = await apiResp.text();
  let filepath = url.searchParams.get("file");
  return {
    filepath,
    codeHtml,
  };
};

export default function FileViewer() {
  let apiUrl = useApiUrl();
  let { id } = useParams();
  let { project } = useOutletContext<{ project: CodeProject }>();
  let { filepath, codeHtml } = useLoaderData<typeof loader>();
  let [numLines, setNumLines] = useState(0);
  const lineNumbers = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codeHtml) {
      let preTag = document.createElement("pre");
      preTag.innerHTML = codeHtml;
      let code = preTag.innerText;
      console.log("🚀 | useEffect | code:", code);
      const lineCount = code.split("\n").length;
      console.log("🚀 | useEffect | lineCount:", lineCount);
      setNumLines(lineCount);
    }
  }, [codeHtml]);

  return (
    <div className="bg-[#222] text-gray-100 h-full">
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#222]">
        <div className="flex items-center">
          <Link
            to={`/projects/${id}`}
            prefetch="intent"
            className="rounded-full p-1 flex items-center justify-center hover:bg-white/10 mr-2"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>
          <h1 className="text-sm tracking-wide">{filepath}</h1>
          <Link
            to={`/projects/${id}`}
            prefetch="intent"
            className="rounded-full p-1 flex items-center justify-center hover:bg-white/10 ml-2"
          >
            <BsX className="w-5 h-5" />
          </Link>
        </div>
        <OpenInCursorButton
          className="hover:bg-gray-700"
          projectId={id!}
          absolutePath={project.absolute_path}
          filepath={filepath!}
        >
          <span className="font-mono">Cursor</span>
          <HiOutlineExternalLink className="h-4 w-4 ml-1" />
        </OpenInCursorButton>
      </div>
      <div className="flex">
        <div
          className="text-gray-500 text-right pt-4 select-none text-xs font-mono bg-[#222]"
          style={{
            minWidth: "3em",
            userSelect: "none",
            paddingTop: "18px",
          }}
        >
          {Array.from({ length: numLines }).map((_, i) => (
            <div className="h-[17.48px] text-right" key={i}>
              {i + 1}
            </div>
          ))}
        </div>
        <div
          className="text-sm [&>pre]:p-4 flex-grow overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: codeHtml }}
        />
      </div>
    </div>
  );
}
