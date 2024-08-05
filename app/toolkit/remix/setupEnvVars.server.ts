import z, { ZodTypeAny } from "zod";
import { Prettify } from "../utils/typescript.utils";

type PublicKeys<T> = {
  [K in keyof T]: K extends `PUBLIC_${infer Rest}` ? K : never;
}[keyof T];

export const setupEnvVars = <TSchema extends ZodTypeAny>(schema: TSchema) => {
  type EnvVars = z.infer<TSchema>;
  type PublicEnvVars = {
    [K in PublicKeys<EnvVars> & string]: string;
  };
  const getEnvVar = (key: keyof EnvVars, fallback = ""): string => {
    if (!key) return "";
    let envVars = schema.parse(process.env);

    return envVars[key] || fallback;
  };

  const getPublicEnvVars = (): Prettify<PublicEnvVars> => {
    let envVars = schema.parse(process.env);

    const publicEnv = Object.entries(envVars).reduce(
      (acc: Record<string, string>, [key, value]) => {
        if (key.startsWith("PUBLIC_")) {
          acc[key] = value as string;
        }
        return acc;
      },
      {}
    );
    return publicEnv as PublicEnvVars;
  };

  return { getEnvVar, getPublicEnvVars };
};
