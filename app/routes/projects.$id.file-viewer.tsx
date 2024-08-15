import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { BsX } from "react-icons/bs";
import { HiOutlineExternalLink } from "react-icons/hi";
import { useApiUrl } from "~/root";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest";
import { OpenInCursorButton } from "./projects.$id/OpenInCursorButton";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  let url = new URL(request.url);
  let apiResp = await proxyApiRequest(request);
  let codeHtml = await apiResp.text();
  console.log("🚀 | loader | codeHtml:", codeHtml);
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
  // let [codeHtml, setCodeHtml] = useState("");
  // let [searchParams, setSearchParams] = useSearchParams();
  // let filepath = searchParams.get("file");

  // let { filepath } = useLoaderData<typeof loader>();

  // useEffect(() => {
  //   if (!filepath) return;
  //   jsonRequest(`${apiUrl}/projects/${id}/file-viewer?file=${filepath}`).then(
  //     (result) => {
  //       console.log("🚀 | useEffect | result:", result);
  //       setCodeHtml(result.html);
  //     }
  //   );
  // }, [apiUrl, filepath]);

  return (
    <div className="bg-[#222] text-gray-100 h-full">
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#222]">
        <div className="flex items-center">
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
      <div
        className="text-sm [&>pre]:p-4 [&>pre]:pl-6 leading-4"
        dangerouslySetInnerHTML={{ __html: codeHtml }}
      />
    </div>
  );
}
