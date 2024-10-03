import madge from "madge";
import path from "path";
export async function getTsModuleDependencies(
  filepath: string,
  options: {
    projectPath: string;
    tsConfigFilename?: string;
  }
): Promise<Record<string, string[]>> {
  let fullFilePath = path.join(options.projectPath, filepath);
  let tsConfigPath = path.join(
    options.projectPath,
    options.tsConfigFilename || "tsconfig.json"
  );
  const response = await madge(fullFilePath, {
    tsConfig: tsConfigPath,
  });
  let tree = response.obj();
  console.log("🚀 | tree:", tree);
  return tree;
}
