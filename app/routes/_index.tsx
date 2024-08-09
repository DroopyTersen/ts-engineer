import { type LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async ({}: LoaderFunctionArgs) => {
  return redirect("/projects");
};

// export default function Index() {
//   let { test } = useLoaderData<typeof loader>();
//   // console.log("🚀 | Index | test:", test);
//   return (
//     <div className="flex flex-col items-center justify-center p-12">
//       <h1 className="text-6xl font-bold ">Hello world!</h1>
//       <Button>Button</Button>

//       <pre className="max-w-3xl text-sm border p-2 text-wrap whitespace-pre-wrap">
//         {test}
//       </pre>
//     </div>
//   );
// }
