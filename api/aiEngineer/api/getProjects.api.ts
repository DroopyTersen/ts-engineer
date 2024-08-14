import { AsyncReturnType } from "~/toolkit/utils/typescript.utils";
import { db } from "../db/db.server";
import { createProjectGit } from "../fs/gitCommands";

export const getProjects = async () => {
  let dbProjects = await await db.getProjects();
  let projects = await Promise.all(
    dbProjects.map(async (project) => {
      let git = createProjectGit(project.absolute_path);
      let [gitStatus, lastUpdate] = await Promise.all([
        git.getStatus(),
        git.getLastModifiedFile(),
      ]);
      return {
        ...project,
        lastUpdate,
        branch: gitStatus.activeBranch,
        unstagedChangesCount: gitStatus.unstaged.length,
        uncommittedChangesCount: gitStatus.uncommitted.length,
      };
    })
  );
  // Sort projects by lastUpdate.updatedAt in descending order
  projects.sort((a, b) => {
    const dateA = a.lastUpdate?.updatedAt
      ? new Date(a.lastUpdate.updatedAt)
      : new Date(0);
    const dateB = b.lastUpdate?.updatedAt
      ? new Date(b.lastUpdate.updatedAt)
      : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return projects;
};

export type ProjectListItem = AsyncReturnType<typeof getProjects>[0];
