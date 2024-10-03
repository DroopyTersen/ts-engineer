import { parseArgs } from "util";
import { exportDependencyTree } from "../api/aiEngineer/api/fs/exportDependencyTree";

const main = async () => {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      project: {
        type: "string",
      },
      file: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });
  let project = values.project;
  if (!project) {
    console.error("Error: --project argument is required.");
    process.exit(1);
  }
  let filepath = values.file;
  if (!filepath) {
    console.error("Error: --filepath argument is required.");
    process.exit(1);
  }

  if (!project.startsWith("/")) {
    console.error("Error: The provided project path must be an absolute path.");
    process.exit(1);
  }

  if (!Bun.file(project).exists()) {
    console.error(`Error: The path "${project}" does not exist.`);
    process.exit(1);
  }
  let result = await exportDependencyTree(filepath, { projectPath: project });
  console.log(result);
};

main().catch(console.error);
