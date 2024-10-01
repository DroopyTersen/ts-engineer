function convertHtmlToText(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}

export async function copyHtmlToClipboard(
  html: string,
  text?: string
): Promise<void> {
  // Convert HTML to plain text
  const plainText = text || convertHtmlToText(html);

  // Create a new ClipboardItem
  const clipboardItemInput = {
    "text/plain": new Blob([plainText], { type: "text/plain" }),
    "text/html": new Blob([html], { type: "text/html" }),
  };
  const clipboardItem = new ClipboardItem(clipboardItemInput);

  // Copy to clipboard
  await navigator.clipboard.write([clipboardItem]);
}

export const copyElementToClipboard = async (
  element: HTMLElement,
  options?: { includeWrapper: boolean }
) => {
  const html =
    options?.includeWrapper === false ? element.innerHTML : element.outerHTML;

  const plainText = element.textContent || element.innerText || "";
  // Create a new ClipboardItem
  const clipboardItemInput = {
    "text/plain": new Blob([plainText], { type: "text/plain" }),
    "text/html": new Blob([html], { type: "text/html" }),
  };
  const clipboardItem = new ClipboardItem(clipboardItemInput);

  // Copy to clipboard
  await navigator.clipboard.write([clipboardItem]);
};

export const copyTextToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};
