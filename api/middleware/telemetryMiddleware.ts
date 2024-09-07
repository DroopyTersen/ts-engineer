import { Context, Next } from "hono";
import { telemetry } from "../telemetry/telemetry.server";

export async function telemetryMiddleware(c: Context, next: Next) {
  let lastRoute = c.req.matchedRoutes?.[c.req.matchedRoutes.length - 1];
  let traceName = `${c.req.method} ${lastRoute.path}`;
  let trace = telemetry.createTrace(traceName, {
    input: {
      url: c.req.url,
      method: c.req.method,
      query: c.req.query.toString(),
    },
    user: {
      id: process.env.USER!,
    },
  });
  let span = telemetry.createSpan(traceName, trace.id).start({});
  (c.set as any)("trace", span);
  await next();
  span.end({});
  const originalResponse = c.res.clone();

  const contentType = originalResponse.headers.get("Content-Type");
  let readBodyPromise =
    contentType && contentType.includes("application/json")
      ? originalResponse.json()
      : originalResponse.text();
  readBodyPromise.then((body) => {
    trace.end({
      status: originalResponse.status,
      body: body,
    });
  });
}
