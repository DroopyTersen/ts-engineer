import { Link, useOutletContext, useParams } from "@remix-run/react";
import { BsX } from "react-icons/bs";
import { useApiUrl } from "~/root";
import { CopyToClipboardButton } from "~/toolkit/components/buttons/CopyToClipboardButton";
import { useAsyncData } from "~/toolkit/hooks/useAsyncData";
import { jsonRequest } from "~/toolkit/http/fetch.utils";

const getMarkdownContent = async (
  apiUrl: string,
  projectId: string,
  selectedFiles: string[]
) => {
  return jsonRequest<{ markdown: string }>(
    apiUrl + `/projects/${projectId}/markdown`,
    {
      method: "POST",
      body: JSON.stringify({ files: selectedFiles }),
    }
  );
};
export default function MarkdownViewer() {
  let { id } = useParams();
  let apiUrl = useApiUrl();
  let { selectedFiles } = useOutletContext<{
    selectedFiles: string[];
  }>();

  let { data } = useAsyncData<{ markdown: string }>(
    getMarkdownContent,
    [apiUrl, id, selectedFiles],
    { markdown: "" }
  );

  return (
    <div className="bg-white text-gray-900 h-full">
      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 sticky top-0 bg-white">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Link
              to={`/projects/${id}`}
              prefetch="intent"
              className="rounded-full p-1 flex items-center justify-center hover:bg-gray-100 mr-2"
              aria-label="Go back"
            >
              <BsX className="w-5 h-5" />
            </Link>
            <h1 className="text-sm tracking-wide">
              Markdown View ({selectedFiles.length} files)
            </h1>
          </div>
          <div className="flex items-center">
            <CopyToClipboardButton plainText={data.markdown} />
          </div>
        </div>
      </div>
      <div className="">
        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-100 px-8 py-4">
          {data.markdown}
        </pre>
      </div>
    </div>
  );
}
