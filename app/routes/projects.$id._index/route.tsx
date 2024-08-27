import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return redirect(`/projects/${params.id}/summary`);
};
