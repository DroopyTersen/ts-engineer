import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

import type { LinksFunction } from "@remix-run/node";
import stylesheet from "./tailwind.css?url";
import { useRouteData } from "./toolkit/remix/useRouteData";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const loader = async () => {
  return {
    apiUrl: process.env.API_URL,
  };
};

export default function App() {
  return (
    <html data-theme="light">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}

export const useApiUrl = () => {
  const apiUrl = useRouteData((r) => r?.data?.apiUrl) || "";
  return apiUrl;
};
