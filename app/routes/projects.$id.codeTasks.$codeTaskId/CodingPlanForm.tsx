import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import { MarkdownTextarea } from "~/toolkit/components/MarkdownTextarea/MarkdownTextarea";
import { useCodeTask } from "./useCodeTask";

export const CodingPlanForm = ({
  codingPlanStream,
  codeTask,
}: ReturnType<typeof useCodeTask>) => {
  let [codingPlan, setCodingPlan] = useState(codeTask?.plan || "");

  useEffect(() => {
    if (!codingPlanStream.isStreaming && codingPlanStream?.message?.content) {
      setCodingPlan(codingPlanStream.message?.content || "");
    }
  }, [codingPlanStream.isStreaming]);

  return (
    <form className="mt-4 max-w-xl">
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
      <div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" asChild className="w-40">
            <Link to="..">Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            className="w-40"
            disabled={codingPlanStream?.isStreaming}
          >
            {codingPlanStream?.isStreaming ? "Generating..." : "Finish"}
          </Button>
        </div>
      </div>
    </form>
  );
};
