import { HiOutlineExternalLink } from "react-icons/hi";
import { useApiUrl } from "~/root";
import { TooltipWrapper } from "~/shadcn/components/ui/TooltipWrapper";

export const OpenInCursorButton = ({
  projectId,
  absolutePath,
}: {
  projectId: string;
  absolutePath: string;
}) => {
  let apiUrl = useApiUrl();
  const openProject = async () => {
    await fetch(`${apiUrl}/projects/${projectId}/open-in-cursor`);
  };
  return (
    <TooltipWrapper tooltip={<p>Open in Cursor</p>}>
      <button
        aria-label="Open in Cursor"
        onClick={() => openProject()}
        className="text-left flex items-center gap-2 px-2 py-[6px] rounded-md text-sm text-muted-foreground  hover:bg-gray-100"
      >
        <span className="font-mono">{absolutePath}</span>
        <HiOutlineExternalLink className="h-4 w-4" />
      </button>
    </TooltipWrapper>
  );
};
