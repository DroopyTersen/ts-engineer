import { Hono } from "hono";
import { cors } from "hono/cors";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { createNewProject } from "./aiEngineer/actions/createNewProject";
import { getProject } from "./aiEngineer/actions/getProject";
import { summarizeProject } from "./aiEngineer/actions/summarizeProject.server";
import { filesToMarkdown } from "./aiEngineer/fs/filesToMarkdown";
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
export default app;

app.get("/projects/:id/files", async (c) => {
  const project = await getProject(c.req.param("id"));
  return c.json(project.files);
});

app.get("/projects/:id/markdown", async (c) => {
  const project = await getProject(c.req.param("id"));
  let markdown = await filesToMarkdown(project.files, project.absolute_path);
  return c.text(markdown);
});

app.post("/projects/:id/summarize", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  summarizeProject(c.req.param("id"), emitter);
  return dataStream.toResponse();
});
