import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
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
  useEffect(() => {
    if (
      !specificationsStream.isStreaming &&
      specificationsStream?.message?.content
    ) {
      setSpecifications(specificationsStream.message?.content || "");
    }
  }, [specificationsStream.isStreaming]);
  return (
    <form
      className="mt-4 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        let formData = new FormData(e.currentTarget);
        let specifications = formData.get("specifications") as string;
        actions.generateCodingPlan(specifications);
      }}
    >
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
        hint={
          specificationsStream?.isStreaming
            ? "AI is generating specifications..."
            : "Review and edit the generated specifications if needed."
        }
      />
      <div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" asChild className="w-50">
            <Link to="..">Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            className="w-40"
            disabled={specificationsStream?.isStreaming}
          >
            {specificationsStream?.isStreaming
              ? "Generating..."
              : "Generate Plan"}
          </Button>
        </div>
      </div>
    </form>
  );
};
