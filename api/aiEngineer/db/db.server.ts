import { codeTasksDb } from "./codeTasks.db";
import { filesDb } from "./files.db";
import { projectsDb } from "./projects.db";

export const db = {
  ...projectsDb,
  ...filesDb,
  ...codeTasksDb,
};
