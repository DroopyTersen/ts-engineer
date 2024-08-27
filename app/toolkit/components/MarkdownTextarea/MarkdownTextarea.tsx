import { useState } from "react";
import { Label } from "~/shadcn/components/ui/label";
import { Switch } from "~/shadcn/components/ui/switch";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { cn } from "~/shadcn/utils";
import { Markdown } from "../Markdown/Markdown";

export const MarkdownTextarea = (props: {
  className?: string;
  label: string;
  value: string;
  name: string;
  hint?: string;
  textareaProps: Omit<
    React.ComponentProps<typeof Textarea>,
    "value" | "onChange" | "name"
  >;
  onChanged: (value: string) => void;
}) => {
  let [mode, setMode] = useState<"edit" | "preview">("edit");
  let rows = props.textareaProps.rows || 12;
  let minHeight = rows * 20 + 18;

  return (
    <>
      <div className={cn("flex flex-col gap-2", props.className)}>
        <div className="flex justify-between items-center">
          <Label htmlFor={props.name} className="">
            {props.label}
          </Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="preview-mode">Preview</Label>
            <Switch
              id="preview-mode"
              checked={mode === "preview"}
              onCheckedChange={(isChecked) =>
                setMode(isChecked ? "preview" : "edit")
              }
            />
          </div>
        </div>

        <Textarea
          id={props.name}
          name={props.name}
          value={props.value}
          onChange={(e) => props.onChanged(e.target.value)}
          rows={rows}
          {...props.textareaProps}
          className={cn(
            mode === "preview" && "hidden",
            props.textareaProps.className
          )}
        />
        {mode === "preview" && (
          <div
            className="border p-4 rounded-md"
            style={{
              minHeight: minHeight + "px",
            }}
          >
            <Markdown>{props.value}</Markdown>
          </div>
        )}
        {props.hint && <p className="text-sm text-gray-500">{props.hint}</p>}
      </div>
    </>
  );
};
