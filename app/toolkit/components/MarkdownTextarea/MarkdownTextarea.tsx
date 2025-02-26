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
  defaultMode?: "edit" | "preview";
  textareaProps: Omit<
    React.ComponentProps<typeof Textarea>,
    "value" | "onChange" | "name"
  >;
  onChanged: (value: string) => void;
}) => {
  let [mode, setMode] = useState<"edit" | "preview">(
    props.defaultMode || "edit"
  );
  let rows = props.textareaProps.rows || 12;
  let minHeight = rows * 20 + 18;

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-2",
          props.className,
          mode === "preview" ? "max-w-4xl" : ""
        )}
      >
        <div className="flex justify-start items-center">
          <Label htmlFor={props.name} className="">
            {props.label}
          </Label>
          <div className="flex items-center space-x-2 ml-12">
            <Switch
              id="edit-mode"
              checked={mode === "edit"}
              onCheckedChange={(isChecked) =>
                setMode(isChecked ? "edit" : "preview")
              }
            />
            <Label htmlFor="edit-mode">Edit</Label>
          </div>
        </div>

        <div
          className={cn(
            mode === "edit" ? "lg:grid lg:grid-cols-2 lg:gap-4" : ""
          )}
        >
          <Textarea
            id={props.name}
            name={props.name}
            value={props.value}
            onChange={(e) => props.onChanged(e.target.value)}
            rows={rows}
            {...props.textareaProps}
            className={cn(
              "font-mono",
              mode === "preview" ? "hidden" : "",
              props.textareaProps.className
            )}
          />
          <div
            className={cn(
              "border p-4 rounded-md",
              mode === "edit" ? "hidden lg:block" : "block"
            )}
            style={{
              minHeight: minHeight + "px",
            }}
          >
            <Markdown>{props.value}</Markdown>
          </div>
        </div>
        {props.hint && <p className="text-sm text-gray-500">{props.hint}</p>}
      </div>
    </>
  );
};
