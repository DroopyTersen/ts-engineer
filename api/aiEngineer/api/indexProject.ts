import { db } from "../db/db.server";
import { processFileContents } from "../fs/getFileContent";
import { getProjectFiles } from "../fs/getProjectFiles";

export const indexProject = async (projectId: string) => {
  const project = await await db.getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  // Delete any existing files for the project;
  await db.deleteProjectFiles(projectId);

  let processProjectFile = async (filepath: string, content: string) => {
    return db.saveProjectFile({
      projectId,
      filepath,
      content,
    });
  };

  let projectFiles = await getProjectFiles(project);
  let fileRecords = await processFileContents(
    projectFiles,
    project.absolute_path,
    processProjectFile
  );

  return {
    projectId,
    files: projectFiles,
  };
};
