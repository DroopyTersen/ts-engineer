import { getProjectFiles } from "#app/aiEngineer/getProjectFiles.js";
import { Button } from "#app/shadcn/components/ui/button.js";
import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({}: LoaderFunctionArgs) => {
  let projectFiles = await getProjectFiles(process.cwd());
  return {
    projectFiles,
  };
};
export default function Index() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <h1 className="text-6xl font-bold ">Hello world!</h1>
      <Button>Button</Button>
    </div>
  );
}
