import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Button } from "~/shadcn/components/ui/button";

export const loader = async ({}: LoaderFunctionArgs) => {
  let test = await fetch(`${process.env.API_URL}/test`).then((resp) =>
    resp.text()
  );
  return {
    test,
  };
};
export default function Index() {
  let { test } = useLoaderData<typeof loader>();
  // console.log("🚀 | Index | test:", test);
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <h1 className="text-6xl font-bold ">Hello world!</h1>
      <Button>Button</Button>

      <pre className="max-w-3xl text-sm border p-2 text-wrap whitespace-pre-wrap">
        {test}
      </pre>
    </div>
  );
}
