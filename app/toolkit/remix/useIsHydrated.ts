import { useEffect, useState } from "react";

let hydrating = true;
export function useIsHydrated() {
  let [isHydrated, setIsHydrated] = useState(() => !hydrating);

  useEffect(function hydrate() {
    hydrating = false;
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
