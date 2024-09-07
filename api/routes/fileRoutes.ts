import { Hono } from "hono";
import { codeToHtml } from "shiki";
import { createEventStreamDataStream } from "~/toolkit/ai/streams/createLLMEventStream";
import { documentProject } from "../aiEngineer/api/documentProjectFiles";
import { getProject } from "../aiEngineer/api/getProject";
import { getFileContent } from "../aiEngineer/fs/getFileContent";

const app = new Hono();

app.post("/:projectId/code-map", async (c) => {
  let dataStream = createEventStreamDataStream(c.req.raw.signal);
  let emitter = dataStream.createEventEmitter();
  let documentedFiles = await documentProject(
    c.req.param("projectId"),
    emitter
  );
  return c.text(
    documentedFiles
      .map((file) => `${file.filepath}\n${file.documentation}`)
      .join("\n\n")
  );
});

app.get("/:projectId/file-viewer", async (c) => {
  let filepath = c.req.query("file");
  if (!filepath) {
    return c.json(
      { error: "?file=<filepath> query param required" },
      { status: 400 }
    );
  }
  let project = await getProject(c.req.param("projectId"));
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
