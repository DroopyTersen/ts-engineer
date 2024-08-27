import { Glob } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { codeToHtml } from "shiki";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { writeSpecifications } from "./aiEngineer/api/codeTask/writeSpecifications";
import { createNewProject } from "./aiEngineer/api/createNewProject";
import { documentProject } from "./aiEngineer/api/documentProjectFiles";
import { getProject } from "./aiEngineer/api/getProject";
import { getProjects } from "./aiEngineer/api/getProjects.api";
import { indexProject } from "./aiEngineer/api/indexProject";
import { summarizeProject } from "./aiEngineer/api/summarizeProject";
import { updateProject } from "./aiEngineer/api/updateProject.api";
import { db } from "./aiEngineer/db/db.server";
import { SearchFilesCriteria } from "./aiEngineer/db/files.db";
import { initDb } from "./aiEngineer/db/pglite/pglite.server";
import { filesToMarkdown } from "./aiEngineer/fs/filesToMarkdown";
import { getFileContent } from "./aiEngineer/fs/getFileContent";
import { openProjectInCursor } from "./aiEngineer/fs/openProjectInCursor";
import { telemetry } from "./telemetry/telemetry.server";

initDb(".pglite");
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
  let trace = telemetry.createTrace(traceName, {
    input: {
      url: context.req.url,
      method: context.req.method,
      query: context.req.query.toString(),
    },
    user: {
      id: process.env.USER!,
    },
  });

  let span = telemetry.createSpan(traceName, trace.id);
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
  let newProject = await createNewProject(formData);
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

app.get("/projects/:id/reindex", async (c) => {
  let result = await indexProject(c.req.param("id"));
  return c.json(result);
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

app.post("/projects/:id/summarize", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  summarizeProject(c.req.param("id"), emitter).finally(() =>
    dataStream.close()
  );
  return dataStream.toResponse();
});

app.get("/projects/:id/codeTasks", async (c) => {
  let codeTasks = await db.getRecentCodeTasks(c.req.param("id"));
  return c.json(codeTasks);
});
app.get("/projects/:id/codeTasks/:codeTaskId", async (c) => {
  let codeTask = await db
    .getCodeTaskById(c.req.param("codeTaskId"))
    .catch((err) => null);
  return c.json(codeTask);
});

app.post("/projects/:id/codeTasks/:codeTaskId/specifications", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  let projectId = c.req.param("id");
  let codeTaskId = c.req.param("codeTaskId");
  let args = await c.req.json();
  writeSpecifications(
    {
      projectId,
      codeTaskId,
      ...args,
    },
    {
      emitter,
    }
  ).finally(() => dataStream.close());
  return dataStream.toResponse();
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
  let filepath = c.req.query("filepath")?.trim();
  await openProjectInCursor(project.absolute_path, filepath);
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

app.get("/search", async (c) => {
  let query = c.req.query("query");
  if (!query) {
    return c.json({ error: "missing query" }, { status: 400 });
  }
  let criteria: SearchFilesCriteria = {
    query,
  };
  if (c.req.query("projectId")) {
    criteria.projectId = c.req.query("projectId");
  }
  if (c.req.query("filepath")) {
    criteria.filepath = c.req.query("filepath");
  }
  if (c.req.query("extension")) {
    criteria.extension = c.req.query("extension");
  }
  console.log("🚀 | app.get | query:", query);
  let results = await db.searchFiles(criteria);
  return c.json(results);
});
export default app;
