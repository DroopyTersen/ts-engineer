import { ProjectClassification } from "@shared/db.schema";
import {
  formatFileStructure,
  getFileContents,
} from "api/aiEngineer/fs/getFileContent";
import { getProject } from "../getProject";
import { getRelevantFiles } from "./getRelevantFiles";

export interface ProjectCodeContext {
  absolutePath: string;
  title: string;
  summary: string;
  fileStructure: string;
  fileContents: string[];
  filepaths: string[];
  classification?: ProjectClassification;
}

interface GetProjectCodeContextParams {
  input: string;
  projectId: string;
  selectedFiles: string[];
  maxTokens?: number;
}

export async function getProjectCodeContext({
  input,
  projectId,
  selectedFiles,
  maxTokens = 64_000,
}: GetProjectCodeContextParams): Promise<ProjectCodeContext> {
  const project = await getProject(projectId);
  let filepaths: string[] = selectedFiles;

  if (!filepaths.length) {
    const relevantFiles = await getRelevantFiles({
      userInput: input,
      project,
      selectedFiles,
      mode: "search",
      minScore: 3,
    });
    filepaths = relevantFiles.filepaths;
  }

  let fileContents = await getFileContents(filepaths, {
    projectPath: project.absolute_path,
    maxTokens,
    maxLinesPerFile: 300,
  });

  const fileStructure = formatFileStructure(project.filepaths);
  return {
    classification: project.classification,
    absolutePath: project.absolute_path,
    title: project.name,
    summary: project.summary,
    fileStructure,
    fileContents,
    filepaths,
  };
}
