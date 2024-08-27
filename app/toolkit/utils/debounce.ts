/**
 * A robust and type-safe debounce function.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the passed function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>): void => {
    const later = () => {
      clearTimeout(timeoutId);
      func(...args);
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
  };
}
