import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useOutletContext } from "@remix-run/react";
import { CodeProject } from "api/aiEngineer/api/getProject";
import { useState } from "react";
import { useApiUrl } from "~/root";
import { Button } from "~/shadcn/components/ui/button";
import { Input } from "~/shadcn/components/ui/input";
import { Label } from "~/shadcn/components/ui/label";
import { Switch } from "~/shadcn/components/ui/switch";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { cn } from "~/shadcn/utils";
import { useEventStream } from "~/toolkit/ai/ui/useEventStream";
import { Markdown } from "~/toolkit/components/Markdown/Markdown";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const response = await proxyApiRequest(request);

  if (!response.ok) {
    const errorData = await response.json();
    return json(errorData, { status: response.status });
  }

  return redirect(`/projects/${params.id}`);
};

export default function EditProject() {
  const { project } = useOutletContext<{ project: CodeProject }>();
  let { summarize, summary, isStreaming, streamId, setSummary } =
    useProjectSummary(project);
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="p-8  max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Edit Project</h1>
      <Form method="post" className="space-y-8">
        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={project.name}
            required
          />
        </div>
        <div>
          <Label htmlFor="absolutePath">Absolute Path</Label>
          <Input
            type="text"
            id="absolute_path"
            name="absolute_path"
            defaultValue={project.absolute_path}
            required
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="summary">Project Summary</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="preview-mode">Preview</Label>
              <Switch
                id="preview-mode"
                checked={isPreview}
                onCheckedChange={setIsPreview}
              />
            </div>
          </div>
          <input type="hidden" name="summary" value={summary} />
          {isStreaming ? (
            <div className="prose prose-sm mt-2 border p-4 rounded-md max-w-4xl">
              <Markdown>{summary}</Markdown>
            </div>
          ) : isPreview ? (
            <div className="prose prose-sm mt-2 border p-4 rounded-md max-w-4xl">
              <input type="hidden" name="summary" value={summary} />
              <Markdown>{summary}</Markdown>
            </div>
          ) : (
            <Textarea
              key={streamId || "summary"}
              rows={12}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          )}
          <Button
            className={cn("mt-2 w-full", isStreaming && "animate-pulse")}
            variant={"ghost"}
            onClick={summarize}
            type="button"
            disabled={isStreaming}
          >
            {isStreaming ? "Summarizing..." : "Summarize"}
          </Button>
        </div>
        <div>
          <Label htmlFor="test_code_command">Verification Command</Label>
          <Input
            type="text"
            id="test_code_command"
            name="test_code_command"
            placeholder="bun run build"
            defaultValue={project.test_code_command}
          />
          <p className="text-sm text-gray-500">
            The CLI command to verify the project's code is okay after the AI
            makes updates.
          </p>
        </div>

        <div>
          <Label htmlFor="exclusions">Exclusions</Label>
          <Textarea
            id="exclusions"
            name="exclusions"
            defaultValue={project.exclusions}
            rows={12}
          />
          <p className="text-sm text-gray-500">
            Comma-separated list of exclusions
          </p>
        </div>
        <div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" asChild className="w-40">
              <Link to="..">Cancel</Link>
            </Button>
            <Button type="submit" size={"lg"} className="w-40">
              Save
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

function useProjectSummary(project: CodeProject) {
  let apiUrl = useApiUrl();
  let apiPath = apiUrl + `/projects/${project.id}/summarize`;
  let [sections, setSections] = useState<{ [index: string]: string }>({});
  let [summaryValue, setSummaryValue] = useState(project.summary);
  let { generate, cancel, ...eventStream } = useEventStream<{
    messages: Array<{ role: string; content: string }>;
  }>(apiPath, (event) => {
    try {
      if (event.event === "data") {
        let message = event.data as { index: number; delta: string };
        let key = message.index + "";
        setSections((prev) => {
          return {
            ...prev,
            [key]: (prev[key] || "") + message.delta,
          };
        });
      }
    } catch (err) {
      console.error("🚀 | useLLMEventsChat | err:", err);
    }
  });
  let summarize = async () => {
    let body = {
      messages: [{ role: "user", content: "Please summarize this project" }],
    };
    await generate(body);
  };

  let isStreaming = eventStream.status === "loading";
  // TODO: process the sections in order to create a big string
  // Process sections to create a single summary string
  let streamingSummary = Object.entries(sections)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, content]) => content)
    .join("\n\n");

  return {
    streamId: eventStream.id,
    summarize,
    isStreaming,
    setSummary: setSummaryValue,
    summary: isStreaming
      ? streamingSummary || ""
      : summaryValue || streamingSummary || project?.summary || "",
  };
}
