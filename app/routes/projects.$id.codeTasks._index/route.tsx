import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { type CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { Button } from "~/shadcn/components/ui/button";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import { generateId } from "~/toolkit/utils/generateId";
import { CodeTasksTable } from "./CodeTasksTable";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  let nextId = generateId(8);
  const codeTasks = await proxyApiRequestAsJson<CodeTaskDbItem[]>(request);
  return {
    nextId,
    codeTasks,
  };
};

export default function CodeTasksRoute() {
  let { id: projectId } = useParams();
  let { nextId, codeTasks } = useLoaderData<typeof loader>();
  return (
    <div className="p-4">
      {codeTasks.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Code Tasks</h1>
            <Button asChild>
              <Link to={nextId}>Start New Code Task</Link>
            </Button>
          </div>
          <CodeTasksTable codeTasks={codeTasks} projectId={projectId!} />
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-semibold mb-4">No Code Tasks Yet!</p>
          <Button asChild>
            <Link to={nextId}>Create your first code task</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
