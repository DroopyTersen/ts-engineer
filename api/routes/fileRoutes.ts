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
  let documentedFiles = await documentProject(c.req.param("projectId"), {
    emitter,
  });
  return c.text(
    documentedFiles
      .map((file) => `${file.filepath}\n${file.documentation}`)
      .join("\n\n")
  );
});
// A list of file extensions that should be mapped to xml syntax highlighting
let xmlMappings = [
  "xsd",
  "xsl",
  "xml",
  "xslt",
  "xslx",
  "csproj",
  "vbproj",
  "fsproj",
  "pom",
  "gradle",
  "sbt",
  "build.gradle",
  "build.sbt",
];
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
    if (xmlMappings.includes(fileExtension)) {
      fileExtension = "xml";
    }
    let html = await codeToHtml(fileContents, {
      lang: fileExtension,
      theme: "slack-dark",
    }).catch(async (err) => {
      console.log("🚀 | app.get | err1:", err);
      let secondTry = await codeToHtml(fileContents, {
        theme: "slack-dark",
        lang: "txt",
      }).catch((err) => {
        console.log("🚀 | app.get | err3:", err);
        return `<pre class="shiki">${fileContents}</pre>`;
      });
      return secondTry;
    });

    // Wrap the final HTML with CDATA
    const wrappedHtml = html;
    console.log("🚀 | app.get | html:", wrappedHtml.slice(0, 100));

    c.header("Cache-Control", "public, max-age=180"); // Cache for 3 minutes
    return c.html(wrappedHtml);
  } catch (error) {
    console.log("🚀 | app.get | error:", error);
    return c.json({ error: "File not found" }, { status: 404 });
  }
});

export default app;
