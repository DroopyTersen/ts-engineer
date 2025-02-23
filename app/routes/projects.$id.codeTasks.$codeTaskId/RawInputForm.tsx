import { Link, useOutletContext } from "@remix-run/react";
import { CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import { Label } from "~/shadcn/components/ui/label";
import { Textarea } from "~/shadcn/components/ui/textarea";

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
      className="mt-4 max-w-4xl"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const input = formData.get("input") as string;
        onSubmit({ input, selectedFiles });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="input">Code Task</Label>
        <Textarea
          id="input"
          name="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={16}
          placeholder="Describe the coding task to be performed..."
        />
        <p className="text-sm text-gray-500">
          Describe what you are trying to do. AI will then generate full
          specifications that you can edit.
        </p>
      </div>
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
