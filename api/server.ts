import { Glob } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { createNewProject } from "./aiEngineer/api/createNewProject";
import { documentProject } from "./aiEngineer/api/documentProjectFiles";
import { getProject } from "./aiEngineer/api/getProject";
import { getProjects } from "./aiEngineer/api/getProjects.api";
import { summarizeProject } from "./aiEngineer/api/summarizeProject";
import { updateProject } from "./aiEngineer/api/updateProject.api";
import { filesToMarkdown } from "./aiEngineer/fs/filesToMarkdown";
import { openProjectInCursor } from "./aiEngineer/fs/openProjectInCursor";
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
  const project = await getProject(c.req.param("id"));
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

export default app;
