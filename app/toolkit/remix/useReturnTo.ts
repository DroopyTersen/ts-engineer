import { useResolvedPath, useSearchParams } from "@remix-run/react";

/** Returns a returnTo if it was specified in searchParmas */
export const useReturnTo = (fallback = "..") => {
  let [searchParams] = useSearchParams();
  let resolvedPath = useResolvedPath(searchParams.get("returnTo") || fallback);

  let path = resolvedPath.pathname;
  if (resolvedPath.hash) {
    path += "#" + resolvedPath.hash;
  }
  if (resolvedPath.search) {
    path += resolvedPath.search;
  }
  return path;
};
