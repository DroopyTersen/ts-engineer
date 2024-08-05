import { LoaderFunctionArgs } from "@remix-run/node";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return proxyApiRequest(request);
};
