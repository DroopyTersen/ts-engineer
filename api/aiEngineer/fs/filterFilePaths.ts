import { minimatch } from "minimatch";

export function testGlobs(filepath: string, globs: string[]) {
  return globs.some((glob) => {
    return minimatch(filepath, glob, {
      dot: true, // Add this to match files starting with dots
      matchBase: true, // Add this to match basename
      nocase: true,
    });
  });
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
