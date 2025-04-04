import { Link, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import { Label } from "~/shadcn/components/ui/label";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { ReasoningDisplay } from "~/toolkit/ai/ui/ReasoningDisplay";
import { ChatToolUsesDebug } from "~/toolkit/ai/ui/ToolUsesDebug";
import { Markdown } from "~/toolkit/components/Markdown/Markdown";
import { MarkdownTextarea } from "~/toolkit/components/MarkdownTextarea/MarkdownTextarea";
import { ApplyInCursorButton } from "./ApplyInCursorButton";
import { useCodeTask } from "./useCodeTask";

export const CodingPlanForm = ({
  codingPlanStream,
  codeTask,
  actions,
}: ReturnType<typeof useCodeTask>) => {
  let [codingPlan, setCodingPlan] = useState(codeTask?.plan || "");
  let [followUpInput, setFollowUpInput] = useState("");
  let [isSaving, setIsSaving] = useState(false);
  let { selectedFiles } = useOutletContext<{
    selectedFiles: string[];
  }>();

  useEffect(() => {
    if (!codingPlanStream.isStreaming && codingPlanStream?.message?.content) {
      setCodingPlan(codingPlanStream.message?.content || "");
    }
  }, [codingPlanStream.isStreaming]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await actions.saveCodingPlan(codingPlan);
      // Optionally, you can add a success message or notification here
    } catch (error) {
      console.error("Error saving coding plan:", error);
      // Optionally, you can add an error message or notification here
    } finally {
      setIsSaving(false);
    }
  };
  let reasoning = codingPlanStream?.message?.reasoning;
  let toolUses = codingPlanStream?.message?.toolUses || [];

  return (
    <form className="mt-4 max-w-screen" onSubmit={(e) => e.preventDefault()}>
      {reasoning && (
        <ReasoningDisplay>
          <Markdown className="prose prose-sm max-w-4xl">{reasoning}</Markdown>
        </ReasoningDisplay>
      )}
      {toolUses?.length > 0 && <ChatToolUsesDebug toolUses={toolUses} />}
      <MarkdownTextarea
        label="Coding Plan"
        value={
          codingPlanStream.isStreaming
            ? codingPlanStream?.message?.content || ""
            : codingPlan
        }
        onChanged={(val) => setCodingPlan(val)}
        name="codingPlan"
        textareaProps={{
          rows: 20,
          placeholder: "AI-generated coding plan will appear here...",
          readOnly: codingPlanStream?.isStreaming,
        }}
        defaultMode={
          codingPlanStream?.isStreaming || !codingPlan?.trim()
            ? "edit"
            : "preview"
        }
        hint={
          codingPlanStream?.isStreaming
            ? "AI is generating the coding plan..."
            : "Review and edit the generated coding plan if needed."
        }
      />
      <div className="space-y-2">
        <div className="space-y-2 mt-4">
          <Label htmlFor="followUpInput">Follow-up Input</Label>
          <Textarea
            id="followUpInput"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            placeholder="Enter follow-up instructions..."
            className="h-24"
          />
        </div>
        <Button
          onClick={() =>
            actions.regenerateCodingPlan(followUpInput, selectedFiles)
          }
          disabled={codingPlanStream.isStreaming || !followUpInput.trim()}
        >
          {codingPlanStream.isStreaming ? "Regenerating..." : "Regenerate Plan"}
        </Button>
      </div>
      <div>
        <div className="mt-6 flex justify-end gap-2 pb-12">
          <Button variant="secondary" asChild className="w-40">
            <Link to="..">Cancel</Link>
          </Button>
          <Button
            onClick={handleSave}
            className="w-40"
            disabled={codingPlanStream?.isStreaming || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <ApplyInCursorButton
            codePlan={codingPlan}
            projectId={codeTask?.project_id}
            codeTaskId={codeTask?.id}
            disabled={codingPlanStream?.isStreaming}
          />
        </div>
      </div>
    </form>
  );
};
