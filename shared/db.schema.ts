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
  files: z
    .union([
      z
        .string()
        .describe("JSON string representing an array of file information"),
      z.array(CodeProjectFile),
    ])
    .transform((input) => {
      if (Array.isArray(input)) {
        return input;
      }
      if (typeof input === "string") {
        try {
          const parsedFiles = JSON.parse(input);
          if (!Array.isArray(parsedFiles)) {
            throw new Error("Parsed files is not an array");
          }
          return parsedFiles
            .map((file) => CodeProjectFile.safeParse(file))
            .filter(
              (
                result
              ): result is z.SafeParseSuccess<
                z.infer<typeof CodeProjectFile>
              > => result.success
            )
            .map((result) => result.data);
        } catch (error) {
          console.error("Error parsing files JSON:", error);
          return [];
        }
      }
      return [];
    }),
});

export type CodeProjectDbItem = z.infer<typeof CodeProjectDbItem>;
