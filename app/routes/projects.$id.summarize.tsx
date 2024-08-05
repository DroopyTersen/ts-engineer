import { ActionFunctionArgs } from "@remix-run/node";
import { proxyApiRequest } from "~/toolkit/http/proxyApiRequest.js";

export const action = async ({ request }: ActionFunctionArgs) => {
  let resp = await proxyApiRequest(request);
  return resp;
};
