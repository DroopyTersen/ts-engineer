import { useSearchParams } from "@remix-run/react";
import { useMemo } from "react";

export const useSearchParam = (key, defaultValue = "") => {
  let [searchParams, setSearchParams] = useSearchParams();
  let setValue = useMemo(() => {
    return (value: string) => {
      let newSearchParams = new URLSearchParams(searchParams);
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
      setSearchParams(newSearchParams);
    };
  }, [key, searchParams]);

  return [searchParams.get(key) || defaultValue, setValue] as [
    string,
    typeof setValue
  ];
};
