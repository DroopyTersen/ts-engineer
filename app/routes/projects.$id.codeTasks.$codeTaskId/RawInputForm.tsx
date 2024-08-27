import { Link } from "@remix-run/react";
import { CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { Button } from "~/shadcn/components/ui/button";
import { Label } from "~/shadcn/components/ui/label";
import { Textarea } from "~/shadcn/components/ui/textarea";

export const RawInputForm = ({
  codeTask,
  onSubmit,
}: {
  codeTask: CodeTaskDbItem | null;
  onSubmit: (data: { input: string }) => void;
}) => {
  // Show the basic input form if there is no specifications yet
  if (!codeTask || !codeTask.specifications) {
    return (
      <form
        className="mt-4 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const input = formData.get("input") as string;
          onSubmit({ input });
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="exclusions" className="">
            Coding Task
          </Label>
          <Textarea
            id="input"
            name="input"
            defaultValue={codeTask?.input}
            rows={8}
            placeholder="Describe the coding task to be performed."
          />
          <p className="text-sm text-gray-500">
            Describe the coding task to be performed...
          </p>
        </div>
        <div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" asChild className="w-40">
              <Link to="..">Cancel</Link>
            </Button>
            <Button type="submit" size={"lg"} className="w-40">
              Next
            </Button>
          </div>
        </div>
      </form>
    );
  }
};
