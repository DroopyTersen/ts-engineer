import { AsyncReturnType } from "~/toolkit/utils/typescript.utils";
import { db } from "../db/db.server";
import { createProjectGit } from "../fs/gitCommands";

export const getProjects = async () => {
  let dbProjects = db.getProjects();
  let projects = await Promise.all(
    dbProjects.map(async (project) => {
      let git = createProjectGit(project.absolute_path);
      let [gitStatus, lastUpdate] = await Promise.all([
        git.getStatus(),
        git.getLastModifiedFile(),
      ]);
      let { files, ...rest } = project;
      return {
        ...rest,
        lastUpdate,
        branch: gitStatus.activeBranch,
        unstagedChangesCount: gitStatus.unstaged.length,
        uncommittedChangesCount: gitStatus.uncommitted.length,
      };
    })
  );

  return projects;
};

export type ProjectListItem = AsyncReturnType<typeof getProjects>[0];
