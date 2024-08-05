import { useEffect, useMemo, useState } from "react";
import { useUpdateEffect } from "./useUpdateEffect";

function validatePageNumber(currentPage: number, totalPages: number): number {
  if (currentPage) {
    const qsPage = parseInt(currentPage + "", 10);
    if (!Number.isNaN(qsPage)) {
      currentPage = qsPage;
    } else {
      return 1;
    }
  }

  if (totalPages > 0 && currentPage > totalPages) return totalPages;
  else if (currentPage < 1) return 1;

  return currentPage;
}

export function usePaging(
  totalPages: number,
  { initialPage = 1, shallow = false } = {}
) {
  const [currentPage, setCurrentPage] = useState(() =>
    validatePageNumber(initialPage, totalPages)
  );
  useEffect(() => {
    setCurrentPage(validatePageNumber(initialPage, totalPages));
  }, [initialPage, totalPages]);

  let goBack = () => {
    let newPage = currentPage - 1;
    if (newPage < 1) newPage = totalPages;
    setCurrentPage(newPage);
  };
  let goForward = () => {
    let newPage = currentPage + 1;
    if (newPage > totalPages) newPage = 1;
    setCurrentPage(newPage);
  };
  let goTo = (pageNumber: number) => {
    if (pageNumber > totalPages) pageNumber = totalPages;
    if (pageNumber < 1) pageNumber = 1;
    setCurrentPage(pageNumber);
  };

  return {
    currentPage,
    goForward,
    goBack,
    goTo,
    totalPages,
  } as PagingContext;
}

export const usePagedItems = function <T = any>(
  allItems: T[],
  itemsPerPage: number,
  { initialPage = 1, shallow = false } = {}
) {
  let totalPages = Math.ceil(allItems.length / itemsPerPage);
  let paging = usePaging(totalPages, { initialPage, shallow });
  let startIndex = (paging.currentPage - 1) * itemsPerPage;
  let endIndex = startIndex + itemsPerPage;

  let items = allItems.slice(startIndex, endIndex);

  useUpdateEffect(() => {
    console.log("All Items changed");
    paging.goTo(1);
  }, [allItems]);

  return [items, paging] as [T[], PagingContext];
};

export interface PagingContext {
  /** Go backwards one page. If you go below page 1, you will be sent to the last page. */
  goBack: () => void;
  /** Go forwards one page. If you exceed the max page, it will go back to the first page. */
  goForward: () => void;
  /** Jump to a specific page number */
  goTo: (page: number) => void;
  /** The current page in state */
  currentPage: number;
  /** The total number of pages */
  totalPages: number;
}

export function usePagingStats(
  totalItems: number,
  itemsPerPage: number,
  currentPage: number
) {
  return useMemo(() => {
    return {
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      start:
        totalItems > 0
          ? Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
          : 0,
      end: Math.min(currentPage * itemsPerPage, totalItems),
    };
  }, [totalItems, itemsPerPage, currentPage]);
}
