import { Hono } from "hono";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { createNewProject } from "../aiEngineer/api/createNewProject";
import { getProject } from "../aiEngineer/api/getProject";
import { getProjects } from "../aiEngineer/api/getProjects.api";
import { indexProject } from "../aiEngineer/api/indexProject";
import { summarizeProject } from "../aiEngineer/api/summarizeProject";
import { updateProject } from "../aiEngineer/api/updateProject.api";
import { filesToMarkdown } from "../aiEngineer/fs/filesToMarkdown";
import { openProjectInCursor } from "../aiEngineer/fs/openProjectInCursor";

const app = new Hono();

app.get("/", async (c) => {
  const projects = await getProjects();
  return c.json(projects);
});

app.post("/new", async (c) => {
  const formData = await c.req.formData();
  let newProject = await createNewProject(formData);
  return c.json(newProject);
});

app.get("/:projectId", async (c) => {
  const project = await getProject(c.req.param("projectId"));
  return c.json(project);
});

app.get("/:projectId/edit", async (c) => {
  const project = await getProject(c.req.param("projectId"));
  return c.json(project);
});

app.post("/:projectId/edit", async (c) => {
  const formData = await c.req.formData();
  let updatedProject = await updateProject(c.req.param("projectId"), formData);
  return c.json(updatedProject);
});

app.get("/:projectId/reindex", async (c) => {
  let result = await indexProject(c.req.param("projectId"));
  return c.json(result);
});

app.get("/:projectId/files", async (c) => {
  const project = await getProject(c.req.param("projectId"));
  return c.json(project.filepaths);
});

app.get("/:projectId/markdown", async (c) => {
  const project = await getProject(c.req.param("projectId"));
  const files = c.req.query("files");
  const filesToProcess = files ? files.split(",") : project.filepaths;
  let markdown = await filesToMarkdown(filesToProcess, project.absolute_path);
  return c.text(markdown);
});
app.post("/:projectId/markdown", async (c) => {
  const project = await getProject(c.req.param("projectId"));
  let body = await c.req.json();
  let filesToProcess = body?.files || project.filepaths;
  let markdown = await filesToMarkdown(filesToProcess, project.absolute_path);
  return c.json({ markdown });
});

app.post("/:projectId/summarize", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  summarizeProject(c.req.param("projectId"), emitter).finally(() =>
    dataStream.close()
  );
  return dataStream.toResponse();
});

app.get("/:projectId/open-in-cursor", async (c) => {
  const project = await getProject(c.req.param("projectId"));
  let filepath = c.req.query("filepath")?.trim();
  await openProjectInCursor(project.absolute_path, filepath);
  return c.json({ message: "Project opened in Cursor" });
});

app.post("/:projectId/selection-usage", async (c) => {
  const { selectedFiles } = await c.req.json();
  let project = await getProject(c.req.param("projectId"), selectedFiles);
  return c.json({
    usageEstimate: project.usageEstimate,
    selectedFiles: selectedFiles,
  });
});

export default app;
