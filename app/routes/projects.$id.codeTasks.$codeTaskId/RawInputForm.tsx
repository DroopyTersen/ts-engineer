import { Link, useOutletContext } from "@remix-run/react";
import { CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import { MarkdownTextarea } from "~/toolkit/components/MarkdownTextarea/MarkdownTextarea";

export const RawInputForm = ({
  codeTask,
  onSubmit,
}: {
  codeTask: CodeTaskDbItem | null;
  onSubmit: (data: { input: string; selectedFiles: string[] }) => void;
}) => {
  let [value, setValue] = useState(codeTask?.input || "");
  const { selectedFiles } = useOutletContext<{ selectedFiles: string[] }>();

  return (
    <form
      className="mt-4 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const input = formData.get("input") as string;
        onSubmit({ input, selectedFiles });
      }}
    >
      <MarkdownTextarea
        label="Code Task"
        value={value}
        onChanged={setValue}
        name="input"
        textareaProps={{
          rows: 16,
          placeholder: "Describe the coding task to be performed...",
        }}
        hint="Describe what you are trying to do. AI will then generate full specifications that you can edit."
      />
      <div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" asChild className="w-40">
            <Link to="..">Cancel</Link>
          </Button>
          <Button type="submit" size={"lg"} className="w-50">
            Generate Specifications
          </Button>
        </div>
      </div>
    </form>
  );
};
