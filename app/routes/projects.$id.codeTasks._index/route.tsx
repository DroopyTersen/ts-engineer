import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { type CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { Button } from "~/shadcn/components/ui/button";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { generateId } from "~/toolkit/utils/generateId";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  let nextId = generateId(8);
  const codeTasks = await proxyApiRequestAsJson<CodeTaskDbItem[]>(request);
  return {
    nextId,
    codeTasks,
  };
};
export default function CodeTasksRoute() {
  let { nextId, codeTasks } = useLoaderData<typeof loader>();
  return (
    <div className="p-2">
      <Button asChild>
        <Link to={nextId}>Start New Code Task</Link>
      </Button>
      <ul>
        {codeTasks.map((codeTask) => (
          <li key={codeTask.id}>
            <Link to={codeTask.id}>{codeTask.input.substring(0, 100)}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
