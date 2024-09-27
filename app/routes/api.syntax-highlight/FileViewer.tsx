import { useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { BsX } from "react-icons/bs";
import { useApiUrl } from "~/root";
import { Button } from "~/shadcn/components/ui/button";
import { cn } from "~/shadcn/utils";
import { useAsyncData } from "~/toolkit/hooks/useAsyncData";
import { OpenInCursorButton } from "../projects.$id/OpenInCursorButton";

const getSyntaxHighlightedCode = async (
  apiUrl: string,
  projectId: string,
  filepath: string
) => {
  return fetch(
    `${apiUrl}/projects/${projectId}/file-viewer?file=${filepath}`
  ).then((res) => res.text());
};
export const FileViewer = ({
  project,
  filepath,
  onClose,
  className,
}: {
  project: {
    id: string;
    absolute_path: string;
  };
  filepath: string;
  onClose: () => void;
  className?: string;
}) => {
  let apiUrl = useApiUrl();
  let { id } = useParams();

  let [numLines, setNumLines] = useState(0);
  let { data: codeHtml } = useAsyncData(
    getSyntaxHighlightedCode,
    [apiUrl, project.id, filepath],
    ""
  );

  useEffect(() => {
    if (codeHtml) {
      let preTag = document.createElement("pre");
      preTag.innerHTML = codeHtml;
      let code = preTag.innerText;
      const lineCount = code.split("\n").length;
      setNumLines(lineCount);
    }
  }, [codeHtml]);

  return (
    <div className={cn("bg-[#222] text-gray-100 h-full", className)}>
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#222]">
        <div className="flex items-center">
          <Button
            variant={"ghost"}
            onClick={() => onClose()}
            aria-label="Go back"
            className="text-white hover:text-white hover:bg-gray-500 rounded-full p-1 w-8 h-8"
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
          </Button>
          <h1 className="text-sm tracking-wide ml-1">{filepath}</h1>
          <Button
            variant={"ghost"}
            onClick={() => onClose()}
            aria-label="Go back"
            className="text-white hover:text-white hover:bg-gray-500 rounded-full p-1 w-7 h-7"
          >
            <BsX className="w-5 h-5" />
          </Button>
        </div>
        <OpenInCursorButton
          className="hover:bg-gray-500"
          projectId={id!}
          absolutePath={project.absolute_path}
          filepath={filepath!}
        >
          <span className="font-mono">Cursor</span>
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
            <div className="line-number text-right" key={i}>
              {i + 1}
            </div>
          ))}
        </div>
        <div
          className="text-sm [&>pre]:p-4 flex-grow"
          dangerouslySetInnerHTML={{ __html: codeHtml }}
        />
      </div>
    </div>
  );
};
