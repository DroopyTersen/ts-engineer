import { describe, expect, it } from "vitest";
import { generateId } from "./generateId";

describe("generateId", () => {
  // Test for correct length
  it("should generate an ID with the specified length", () => {
    const length = 10;
    const id = generateId(length);
    expect(id.length).toBe(length);
  });

  // Test for character set
  it("should only contain uppercase alphanumeric characters", () => {
    const id = generateId(20);
    expect(id).toMatch(/^[A-Z0-9]+$/);
  });

  // Test for uniqueness
  it("should generate unique IDs", () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId(8));
    }
    expect(ids.size).toBe(1000);
  });

  // Test for edge cases
  it("should handle length of 0", () => {
    const id = generateId(0);
    expect(id).toBe("");
  });

  it("should handle very large lengths", () => {
    const length = 100;
    const id = generateId(length);
    expect(id.length).toBe(length);
  });

  // Test for handling of negative lengths
  it("should return an empty string for negative lengths", () => {
    const id = generateId(-5);
    expect(id).toBe("");
  });

  // Test for non-integer lengths
  it("should round down non-integer lengths", () => {
    const id = generateId(5.7);
    expect(id.length).toBe(5);
  });
});
