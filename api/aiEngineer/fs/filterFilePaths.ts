import { Glob } from "bun";

export function testGlobs(filepath: string, globs: string[]) {
  let hasMatch = globs.some((glob) => {
    let g = new Glob(glob);
    return g.match(filepath);
  });
  return hasMatch;
}

export function filterFilePaths(
  filepaths: string[],
  includes: string[] = [],
  excludes: string[] = []
) {
  let files = filepaths;
  if (includes.length > 0) {
    files = files.filter((file) => testGlobs(file, includes));
  }
  if (excludes.length > 0) {
    files = files.filter((file) => !testGlobs(file, excludes));
  }
  return files;
}
