import { minimatch } from "minimatch";
import { describe, expect, it } from "vitest";
import { filterFilePaths, testGlobs } from "./filterFilePaths";

describe("minimatch direct test", () => {
  it("should match exe files directly with minimatch", () => {
    const filepath = ".nuget/NuGet.exe";
    const pattern = "**/*.exe";
    // Test minimatch directly to verify it works as expected
    const result = minimatch(filepath, pattern, {
      dot: true,
      matchBase: true,
      nocase: true,
    });
    expect(result).toBe(true);
  });
});

describe("testGlobs", () => {
  it("should match .exe files with **/*.exe pattern", () => {
    const filepath = ".nuget/NuGet.exe";
    const globs = ["**/*.exe"];
    // Add debug logging
    console.log({
      filepath,
      globs,
      directMatch: minimatch(filepath, globs[0], {
        dot: true,
        matchBase: true,
        nocase: true,
      }),
    });
    expect(testGlobs(filepath, globs)).toBe(true);
  });

  // Test with actual path structure
  it("should match nested exe files", () => {
    const testCases = [
      ".nuget/NuGet.exe",
      "tools/something.exe",
      "deeply/nested/path/file.exe",
    ];

    testCases.forEach((filepath) => {
      expect(testGlobs(filepath, ["**/*.exe"])).toBe(true);
    });
  });
});

describe("filterFilePaths", () => {
  it("should filter out exe files", () => {
    const files = [".nuget/NuGet.exe", "src/index.ts", "tools/helper.exe"];

    const result = filterFilePaths(files, [], ["**/*.exe"]);
    expect(result).toEqual(["src/index.ts"]);
  });
});
