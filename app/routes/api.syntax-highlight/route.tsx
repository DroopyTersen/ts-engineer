import { ActionFunctionArgs, HeadersFunction } from "@remix-run/node";
import { transformerNotationDiff } from "@shikijs/transformers";
import { codeToHtml } from "shiki";

export const headers: HeadersFunction = ({}) => ({
  // Cache for 5 minutes on the client, 1 hour on the server
  "Cache-Control": "max-age=3600",
});

export const action = async ({ request }: ActionFunctionArgs) => {
  let {
    code,
    lang,
    theme = "slack-dark",
    structure = "classic",
  } = await request.json();
  let html = await codeToHtml(code, {
    lang,
    theme,
    structure,
    transformers: [transformerNotationDiff({})],
  });
  return {
    code,
    html,
  };
};
