import { z } from "zod";

export const CodeProjectFile = z.object({
  filepath: z.string(),
  documentation: z.string(),
});
export type CodeProjectFile = z.infer<typeof CodeProjectFile>;

export const CodeProjectDbItem = z.object({
  id: z.string(),
  name: z.string(),
  absolute_path: z
    .string()
    .describe("The absolute path to the project directory"),
  summary: z
    .string()
    .describe(
      "An overview of the app/project. What does it do? what is the tech stack? etc..."
    ),
  exclusions: z.string().default(""),
  test_code_command: z.string().default("bun run build"),
});

export type CodeProjectDbItem = z.infer<typeof CodeProjectDbItem>;

export const FileSearchResultSchema = z.object({
  id: z.string(),
  filepath: z.string(),
  project_id: z.string().nullable(),
  summary: z.string().nullable(),
  documentation: z.string().nullable(),
  content: z.string().nullable(),
  updated_at: z
    .union([z.string(), z.date()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  extension: z.string().nullable(),
  num_chars: z.number().nullable(),
  filename: z.string().nullable(),
  similarity: z.number().optional(), // similarity is only present in search_files_with_embedding
  rank: z.number().optional(), // rank is only present in search_files
});
