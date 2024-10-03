import { filesToMarkdown } from "api/aiEngineer/fs/filesToMarkdown";
import { getTsModuleDependencies } from "api/aiEngineer/fs/getTsModuleDependencies";

export const exportDependencyTree = async (
  filepath: string,
  options: {
    projectPath: string;
  }
) => {
  let tree = await getTsModuleDependencies(filepath, options);

  // Flatten the tree into a set of distinct filenames
  const filenames = new Set<string>();
  filenames.add(filepath);
  // Helper function to recursively gather dependencies
  const gatherDependencies = (file: string) => {
    if (!filenames.has(file)) {
      filenames.add(file);
      const dependencies = tree[file] || [];
      dependencies.forEach((dep) => gatherDependencies(dep));
    }
  };

  // Start gathering dependencies from the root files
  Object.keys(tree).forEach((file) => gatherDependencies(file));

  // Convert the set to an array and strip "../" from each filename
  let filepaths = Array.from(filenames).map((filename) =>
    filename.startsWith("../") ? filename.slice(3) : filename
  );

  // the last filepath is the target file, but it doesn't have a project
  // relative path so we'll strip it off.
  filepaths = filepaths.slice(0, -1);
  console.log("🚀 | filepaths:", filepaths);
  return filesToMarkdown(filepaths, {
    projectPath: options.projectPath,
    maxLinesPerFile: 300,
    maxTokens: 100_000,
  });
};
