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
  sortItems.sort((a: any, b: any) => {
    let lhs = getValue(a, sortKey);
    let rhs = getValue(b, sortKey);

    // Handle null/undefined/empty values
    const lhsEmpty = lhs === null || lhs === undefined || lhs === "";
    const rhsEmpty = rhs === null || rhs === undefined || rhs === "";

    // Always put empty values last regardless of sort direction
    if (lhsEmpty && !rhsEmpty) return 1;
    if (!lhsEmpty && rhsEmpty) return -1;
    if (lhsEmpty && rhsEmpty) return 0;

    // Both values are non-empty, do normal comparison
    if (typeof lhs === "string" && typeof rhs === "string") {
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
