import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

import stylesheet from "./tailwind.css?url";
import type { LinksFunction } from "@remix-run/node";
import { Button } from "~/shadcn/components/ui/button";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];
export default function App() {
  return (
    <html data-theme="light">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex flex-col items-center justify-center p-12">
          <h1 className="text-6xl font-bold ">Hello world!</h1>
          <Button>Button</Button>
        </div>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
