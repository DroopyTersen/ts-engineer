import { Glob } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { codeToHtml } from "shiki";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { createNewProject } from "./aiEngineer/api/createNewProject";
import { documentProject } from "./aiEngineer/api/documentProjectFiles";
import { getProject } from "./aiEngineer/api/getProject";
import { getProjects } from "./aiEngineer/api/getProjects.api";
import { summarizeProject } from "./aiEngineer/api/summarizeProject";
import { updateProject } from "./aiEngineer/api/updateProject.api";
import { filesToMarkdown } from "./aiEngineer/fs/filesToMarkdown";
import { getFileContent } from "./aiEngineer/fs/getFileContent";
import { openProjectInCursor } from "./aiEngineer/fs/openProjectInCursor";
import { telemetry } from "./telemetry/telemetry.server";

const app = new Hono();

// Add CORS middleware
app.use(
  "/*",
  cors({
    origin: "*", // Allow all origins
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

const createReqSpan = (context: any) => {
  let lastRoute =
    context.req.matchedRoutes?.[context.req.matchedRoutes.length - 1];
  let traceName = `${context.req.method} ${lastRoute.path}`;
  let span = telemetry.createSpan(traceName);
  return span;
};
app.use("/disabled-telemetry", async (c, next) => {
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
});

app.get("/projects", async (c) => {
  const projects = await getProjects();
  return c.json(projects);
});

app.get("/test", async (c) => {
  let glob = "**/data/**";
  let filepath = "data/movies/10144.json";
  let g = new Glob(glob);
  let matches = g.match(filepath);
  return c.json({ matches, filepath, glob });
});

app.post("/projects/new", async (c) => {
  const formData = await c.req.formData();
  let newProject = createNewProject(formData);
  console.log("🚀 | app.post | newProject:", newProject);

  return c.json(newProject);
});

app.get("/projects/:id", async (c) => {
  let trace = createReqSpan(c).start({
    projectId: c.req.param("id"),
  });
  const project = await getProject(c.req.param("id"), undefined, {
    traceId: trace.id,
  });
  trace.end(project);
  return c.json(project);
});
app.get("/projects/:id/edit", async (c) => {
  const project = await getProject(c.req.param("id"));
  return c.json(project);
});
app.post("/projects/:id/edit", async (c) => {
  const formData = await c.req.formData();
  console.log("🚀 | app.post | edit project:", Object.fromEntries(formData));
  let updatedProject = await updateProject(c.req.param("id"), formData);
  return c.json(updatedProject);
});

app.get("/projects/:id/files", async (c) => {
  const project = await getProject(c.req.param("id"));
  return c.json(project.filepaths);
});

app.get("/projects/:id/markdown", async (c) => {
  const project = await getProject(c.req.param("id"));
  let markdown = await filesToMarkdown(
    project.filepaths,
    project.absolute_path
  );
  return c.text(markdown);
});

// app.get("/projects/:id/exported-api", async (c) => {
//   const project = await getProject(c.req.param("id"));
//   let markdown = await filesToExportedApi(
//     project.filepaths,
//     project.absolute_path
//   );
//   return c.text(markdown);
// });

app.post("/projects/:id/summarize", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  summarizeProject(c.req.param("id"), emitter).finally(() =>
    dataStream.close()
  );
  return dataStream.toResponse();
});

app.get("/projects/:id/code-map", async (c) => {
  const project = await getProject(c.req.param("id"));
  return c.text(
    project.files
      .map((file) => `${file.filepath}\n${file.documentation}`)
      .join("\n\n")
  );
});
app.post("/projects/:id/code-map", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  let documentedFiles = await documentProject(c.req.param("id"), emitter);
  return c.text(
    documentedFiles
      .map((file) => `${file.filepath}\n${file.documentation}`)
      .join("\n\n")
  );
});

app.get("/projects/:id/open-in-cursor", async (c) => {
  const project = await getProject(c.req.param("id"));
  await openProjectInCursor(project.absolute_path);
  return c.json({ message: "Project opened in Cursor" });
});

app.post("/projects/:id/selection-usage", async (c) => {
  const { selectedFiles } = await c.req.json();
  let project = await getProject(c.req.param("id"), selectedFiles);

  return c.json({
    usageEstimate: project.usageEstimate,
    selectedFiles: selectedFiles,
  });
});

app.get("/projects/:id/file-viewer", async (c) => {
  let filepath = c.req.query("file");
  if (!filepath) {
    return c.json(
      { error: "?file=<filepath> query param required" },
      { status: 400 }
    );
  }
  let project = await getProject(c.req.param("id"));
  try {
    let fileContents = await getFileContent(filepath, project.absolute_path);
    let fileExtension =
      filepath.split(".").pop()?.replace(".", "") || "plaintext";
    let html = await codeToHtml(fileContents, {
      lang: fileExtension,
      theme: "slack-dark",
    });
    return c.html(html);
  } catch (error) {
    return c.json({ error: "File not found" }, { status: 404 });
  }
});
export default app;
