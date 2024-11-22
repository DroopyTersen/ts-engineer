import { matchSorter } from "match-sorter";
import { useMemo, useState } from "react";
import { useDebouncedValue } from "./useDebounce";

export const useFilteredItemsByText = <TItem>(
  allItems: Array<TItem>,
  properties: Array<keyof TItem>,
  initialFilterText = ""
) => {
  const [filterText, setFilterText] = useState(initialFilterText);

  const debouncedFilterText = useDebouncedValue(filterText, 250);

  const filteredItems = useMemo(() => {
    if (allItems && allItems.length) {
      if (!properties.length) {
        return allItems;
      }
      const items = matchSorter(allItems, debouncedFilterText, {
        keys: properties as string[],
        threshold: matchSorter.rankings.CONTAINS,
      });
      return items;
    }

    return [];
  }, [allItems, debouncedFilterText, properties]);

  return {
    filteredItems,
    setFilterText,
    filterText,
  };
};
