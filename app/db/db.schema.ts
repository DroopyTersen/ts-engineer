import { z } from "zod";

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
});

export type CodeProjectDbItem = z.infer<typeof CodeProjectDbItem>;
