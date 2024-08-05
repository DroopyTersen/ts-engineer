import { Label } from "@radix-ui/react-label";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { CodeProjectDbItem } from "@shared/db.schema";
import { Button } from "~/shadcn/components/ui/button.js";
import { Input } from "~/shadcn/components/ui/input.js";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest.js";

export const action = async ({ request }: ActionFunctionArgs) => {
  let resp = await proxyApiRequest(request);
  let newProject = (await resp.json()) as CodeProjectDbItem;
  return redirect("/projects/" + newProject.id);
};
export default function NewProject() {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-4xl font-bold">Add a new Project</h1>
      <Form method="POST">
        <div className="grid gap-3 mt-6">
          <Label htmlFor="absolutePath">Absolute Path</Label>
          <Input required name="absolutePath" id="absolutePath" />
          <p className="text-xs text-slate-500" data-description>
            The absolute path to the project's root directory.
          </p>
        </div>
        <div className="grid gap-3 mt-6">
          <Label htmlFor="name">Name</Label>
          <Input name="name" id="name" />
          <p className="text-xs text-slate-500" data-description>
            The name of your project. If left blank, the last segment of the
            absolute path will be used.
          </p>
        </div>
        <div className="mt-2">
          <Button>Add</Button>
        </div>
      </Form>
    </div>
  );
}
