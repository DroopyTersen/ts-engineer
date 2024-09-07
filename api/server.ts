import { Hono } from "hono";
import { cors } from "hono/cors";
import { initDb } from "./aiEngineer/db/pglite/pglite.server";
import { telemetryMiddleware } from "./middleware/telemetryMiddleware";
import codeTaskRoutes from "./routes/codeTaskRoutes";
import fileRoutes from "./routes/fileRoutes";
import projectRoutes from "./routes/projectRoutes";
import searchRoutes from "./routes/searchRoutes";

initDb(".pglite");
const app = new Hono();

// Add CORS middleware
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("/disabled-telemetry", telemetryMiddleware);

// Mount route modules
app.route("/projects", projectRoutes);
app.route("/projects", codeTaskRoutes);
app.route("/projects", fileRoutes);
app.route("/search", searchRoutes);

// Keep the test route in the main file
app.get("/test", async (c) => {
  // ... (test route implementation)
});

export default app;
