import { describe, expect, it } from "bun:test";
import { grepProjectFiles } from "./grepProjectFiles";

describe("grepProjectFiles", () => {
  const PROJECT_PATH = "/Users/drew/code/ts-engineer";
  it("should return an array of GrepResultItem", async () => {
    const result = await grepProjectFiles(PROJECT_PATH, "export const loader");
    console.log("🚀 | it | result:", result);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("snippet");
    expect(result[0].snippet).toContain("export const loader");
    result.forEach((item) => {
      expect(item.filepath).not.toBeNull();
      expect(item.lineNumber).not.toBeNull();
      expect(item.snippet).not.toBeNull();
      console.log("\n" + item.snippet);
    });
  });
});
