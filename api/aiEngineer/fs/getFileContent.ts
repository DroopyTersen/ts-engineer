import { join } from "path";

export const getFileContent = (path: string, absolutePath = "") => {
  try {
    let filepath = path.includes(absolutePath)
      ? path
      : join(absolutePath, path);
    return Bun.file(filepath).text();
  } catch (error) {
    console.error(`Error reading file ${path}`, error);
    return "";
  }
};

export const processFileContents = <T>(
  filepaths: string[],
  absolutePath: string,
  process: (filepath: string, content: string) => T
) => {
  return Promise.all(
    filepaths.map(async (filepath) => {
      const content = await getFileContent(filepath, absolutePath);
      return process(filepath, content);
    })
  );
};
