import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { BsX } from "react-icons/bs";
import { useApiUrl } from "~/root";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest";

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
      <div className="px-4 py-2 flex items-center border-b border-white/10 sticky top-0 bg-[#222]">
        <h1 className="text-sm tracking-wide">{filepath}</h1>
        <Link
          to={`/projects/${id}`}
          prefetch="intent"
          className="rounded-full p-1 flex items-center justify-center hover:bg-white/10"
        >
          <BsX className="w-5 h-5" />
        </Link>
      </div>
      <div
        className="text-sm [&>pre]:p-4 text-[12px] leading-4"
        dangerouslySetInnerHTML={{ __html: codeHtml }}
      />
    </div>
  );
}
