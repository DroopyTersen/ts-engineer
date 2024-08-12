export function formatNumber(value: number, precision: number = 1): string {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: precision,
  });

  return formatter.format(value);
}
