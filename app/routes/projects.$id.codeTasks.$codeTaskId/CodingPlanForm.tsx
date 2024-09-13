import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import { Label } from "~/shadcn/components/ui/label";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { MarkdownTextarea } from "~/toolkit/components/MarkdownTextarea/MarkdownTextarea";
import { useCodeTask } from "./useCodeTask";

export const CodingPlanForm = ({
  codingPlanStream,
  codeTask,
  actions,
}: ReturnType<typeof useCodeTask>) => {
  let [codingPlan, setCodingPlan] = useState(codeTask?.plan || "");
  let [followUpInput, setFollowUpInput] = useState("");
  let [isSaving, setIsSaving] = useState(false);

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

  return (
    <form className="mt-4 max-w-3xl" onSubmit={(e) => e.preventDefault()}>
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
          onClick={() => actions.regenerateCodingPlan(followUpInput)}
          disabled={codingPlanStream.isStreaming || !followUpInput.trim()}
        >
          {codingPlanStream.isStreaming ? "Regenerating..." : "Regenerate Plan"}
        </Button>
      </div>
      <div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" asChild className="w-40">
            <Link to="..">Cancel</Link>
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            className="w-40"
            disabled={codingPlanStream?.isStreaming || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
};
