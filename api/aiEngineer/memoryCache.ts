import { createSingleton } from "~/toolkit/utils/createSingleton.server";

export const memoryCache = createSingleton("cache", () => {
  return new Map<string, any>();
});
