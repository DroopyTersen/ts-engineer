import getValue from "just-safe-get";
import { useEffect, useMemo, useRef, useState } from "react";

function defaultSortMethod<T>(
  items: T[],
  sortKey: string,
  sortDir?: SortDirType
) {
  // Just in case we didn't specify a sort key
  if (!sortKey) return items;

  const sortItems = [...items];
  sortItems.sort((a, b) => {
    let lhs = getValue(a, sortKey);
    lhs = lhs !== null && lhs !== undefined ? lhs : "";

    let rhs = getValue(b, sortKey);
    rhs = rhs !== null && rhs !== undefined ? rhs : "";

    if (lhs.localeCompare && rhs.localeCompare) {
      // Perform string comparison
      return sortDir === "ASC"
        ? lhs.localeCompare(rhs)
        : rhs.localeCompare(lhs);
    }

    return sortDir === "ASC" ? lhs - rhs : rhs - lhs;
  });

  return sortItems;
}

interface SortingState {
  sortKey?: string;
  sortDir?: SortDirType;
}

export type SortDirType = "ASC" | "DESC";

// Based off of https://codesandbox.io/s/compount-components-with-a-hook-txolo?from-embed=&file=/hooks/useSorting.js
export function useSorting<T>(
  items: Array<T>,
  initial: SortingState = {},
  sortMethod = defaultSortMethod
) {
  // We don't want to re-render if the sort fn changes
  // because most likely it changed "accidentally" by
  // consumer re-creating the same function definition
  const sortMethodRef = useRef(sortMethod);

  useEffect(() => {
    sortMethodRef.current = sortMethod;
  }, [sortMethod]);

  const [sort, setSort] = useState<SortingState>({
    sortDir: "ASC",
    sortKey: "",
    ...initial,
  });

  const onSort = (newSortKey: string) => {
    const isAsc = sort.sortKey === newSortKey && sort.sortDir === "ASC";
    setSort({
      sortKey: newSortKey,
      sortDir: isAsc ? "DESC" : "ASC",
    });
  };

  // Sort case-insensitive by whatever column is selected
  const sortedItems = useMemo(
    () => sortMethodRef.current(items, sort.sortKey || "", sort.sortDir),
    [items, sort]
  );

  return {
    sortedItems,
    onSort,
    ...sort,
  };
}
