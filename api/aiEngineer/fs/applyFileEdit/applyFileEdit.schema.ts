import { z } from "zod";

// Base Operation
const BaseOperation = z.object({
  type: z.string().describe("The type of operation to perform"),
  pattern: z.string().describe("The REGEX pattern to match in the file"),
});
export type BaseOperation = z.infer<typeof BaseOperation>;

// Insert Operation
const InsertOperation = BaseOperation.extend({
  type: z.literal("insert"),
  content: z.string(),
  position: z.enum(["before", "after", "start", "end"]),
});
export type InsertOperation = z.infer<typeof InsertOperation>;

// Replace Operation
const ReplaceOperation = BaseOperation.extend({
  type: z.literal("replace"),
  content: z.string(),
});
export type ReplaceOperation = z.infer<typeof ReplaceOperation>;

// Delete Operation
const DeleteOperation = BaseOperation.extend({
  type: z.literal("delete"),
});
export type DeleteOperation = z.infer<typeof DeleteOperation>;

// Combined Operation
const FileEditOperation = z.discriminatedUnion("type", [
  InsertOperation,
  ReplaceOperation,
  DeleteOperation,
]);
export type FileEditOperation = z.infer<typeof FileEditOperation>;

// FileEdit
export const FileEdit = z.object({
  file: z.string(),
  operations: z.array(FileEditOperation),
});
export type FileEdit = z.infer<typeof FileEdit>;
