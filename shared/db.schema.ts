import { z } from "zod";
import { Prettify } from "~/toolkit/utils/typescript.utils";

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

export const CodeProject = z.object({
  id: z.string(),
  name: z.string(),
  absolute_path: z.string(),
  summary: z.string().optional(),
  files: z.array(z.string()),
  usageEstimate: z
    .object({
      tokens: z.number().optional(),
      cost: z.number().optional(),
    })
    .optional(),
});
export type CodeProject = Prettify<z.infer<typeof CodeProject>>;
