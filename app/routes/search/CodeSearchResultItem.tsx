import { SerializeFrom } from "@remix-run/node";
import { Link } from "@remix-run/react";
import type { CodeSearchResultItem } from "api/aiEngineer/db/files.db";
import { useRef } from "react";
import { Button } from "~/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/shadcn/components/ui/card";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";
import { TooltipWrapper } from "~/shadcn/components/ui/TooltipWrapper";
import { cn } from "~/shadcn/utils";
import { OpenInCursorButton } from "../projects.$id/OpenInCursorButton";

interface CodeSearchResultItemProps {
  item: CodeSearchResultItem | SerializeFrom<CodeSearchResultItem>;
  viewFile: (filepath: string) => void;
}

export function CodeSearchResultItem({
  item,
  viewFile,
}: CodeSearchResultItemProps) {
  let snippetRef = useRef<HTMLDivElement>(null);
  // useEffect(() => {
  //   if (snippetRef.current) {
  //     const highlightedLine =
  //       snippetRef.current.querySelector(".line.highlighted");
  //     if (highlightedLine) {
  //       // Scroll to the highlighted line with a small offset for better visibility
  //       highlightedLine.scrollIntoView({
  //         behavior: "instant",
  //         block: "center",
  //         inline: "center",
  //       });
  //     }
  //   }
  // }, [item?.snippet]);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2 items-center">
              <TooltipWrapper tooltip={<p>Go to Project</p>}>
                <Link
                  to={`/projects/${item?.project_id}`}
                  className={cn("text-base hover:underline")}
                >
                  {item.project?.name}
                </Link>
              </TooltipWrapper>
              <span className="text-gray-400 text-sm">/</span>
              <TooltipWrapper tooltip={<p>View Code</p>}>
                <Button
                  className="text-lg font-mono"
                  variant={"ghost"}
                  onClick={() => viewFile(item.id)}
                >
                  {item.filename || item.filepath.split("/").pop()}
                </Button>
              </TooltipWrapper>
            </div>
            <OpenInCursorButton
              absolutePath={item.project?.absolute_path!}
              projectId={item?.project_id!}
              filepath={item.filepath}
            >
              <span className="text-sm text-muted-foreground font-normal font-mono">
                {item.filepath}
              </span>
            </OpenInCursorButton>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {item.summary && <p className="text-sm mb-2">{item.summary}</p>}
        {item.snippet && (
          <div className="mt-2">
            <ScrollArea
              ref={snippetRef}
              className="h-[200px] w-full rounded-md border p-2 bg-[#222] text-white"
            >
              <pre
                className="text-sm [&>pre]:p-4 flex-grow"
                dangerouslySetInnerHTML={{ __html: item.snippet }}
              />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
