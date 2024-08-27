import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/shadcn/components/ui/button";
import { generateId } from "~/toolkit/utils/generateId";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  let nextId = generateId(8);
  return {
    nextId,
  };
};
export default function CodeTasksRoute() {
  let { nextId } = useLoaderData<typeof loader>();
  return (
    <div className="p-2">
      <Button asChild>
        <Link to={nextId}>Start New Code Task</Link>
      </Button>
      <h2>TODO: Show Code Task History</h2>
    </div>
  );
}
