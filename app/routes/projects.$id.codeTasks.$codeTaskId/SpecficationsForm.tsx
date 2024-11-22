import { useOutletContext } from "@remix-run/react";
import type { CodeProject } from "api/aiEngineer/api/getProject";
import { useEffect, useState } from "react";
import { BsChevronRight } from "react-icons/bs";
import { Button } from "~/shadcn/components/ui/button";
import { Label } from "~/shadcn/components/ui/label";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { cn } from "~/shadcn/utils";
import { MarkdownTextarea } from "~/toolkit/components/MarkdownTextarea/MarkdownTextarea";
import { useCodeTask } from "./useCodeTask";

export const SpecificationsForm = ({
  specificationsStream,
  codeTask,
  actions,
}: ReturnType<typeof useCodeTask>) => {
  let [specifications, setSpecifications] = useState(
    codeTask?.specifications || ""
  );
  let [followUpInput, setFollowUpInput] = useState("");

  const { project, selectedFiles } = useOutletContext<{
    project: CodeProject;
    selectedFiles: string[];
  }>();

  useEffect(() => {
    if (
      !specificationsStream.isStreaming &&
      specificationsStream?.message?.content
    ) {
      setSpecifications(specificationsStream.message?.content || "");
    }
  }, [specificationsStream.isStreaming]);

  return (
    <form className="mt-4 max-w-3xl" onSubmit={(e) => e.preventDefault()}>
      <MarkdownTextarea
        label="Specifications"
        value={
          specificationsStream.isStreaming
            ? specificationsStream?.message?.content || ""
            : specifications
        }
        onChanged={(val) => setSpecifications(val)}
        name="specifications"
        textareaProps={{
          rows: 16,
          placeholder: "AI-generated specifications will appear here...",
          readOnly: specificationsStream?.isStreaming,
        }}
        defaultMode={
          specificationsStream?.isStreaming || !specifications?.trim()
            ? "edit"
            : "preview"
        }
        hint={
          specificationsStream?.isStreaming
            ? "AI is generating specifications..."
            : "Review and edit the generated specifications if needed."
        }
      />
      <div className="space-y-2 mt-4">
        <Label htmlFor="followUpInput">Follow-up Input</Label>
        <Textarea
          id="followUpInput"
          value={followUpInput}
          onChange={(e) => setFollowUpInput(e.target.value)}
          placeholder="Enter follow-up instructions..."
          className="h-24"
        />
        <Button
          variant="ghost"
          onClick={() => {
            actions.regenerateSpecifications(followUpInput);
            setFollowUpInput("");
          }}
          className={cn("w-full")}
          disabled={specificationsStream.isStreaming || !followUpInput.trim()}
        >
          {specificationsStream.isStreaming
            ? "Regenerating..."
            : "Regenerate Specifications"}
        </Button>
      </div>
      <div>
        <div className="mt-6 flex justify-between gap-2">
          <Button
            onClick={() =>
              actions.saveSpecifications(specifications, selectedFiles)
            }
            size="lg"
            className="w-44"
          >
            {specificationsStream?.isStreaming ? "Streaming..." : "Save"}
          </Button>
          <Button
            onClick={() =>
              actions.generateCodingPlan(specifications, selectedFiles)
            }
            size="lg"
            className="w-44"
            disabled={specificationsStream?.isStreaming}
          >
            {specificationsStream?.isStreaming ? (
              "Generating..."
            ) : (
              <>
                Generate Plan
                <BsChevronRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
