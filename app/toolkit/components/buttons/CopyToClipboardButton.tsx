import { useEffect, useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import { cn } from "~/shadcn/utils";
import { copyHtmlToClipboard } from "~/toolkit/utils/clipboard.utils.client";

interface Props {
  plainText?: string | (() => string);
  html?: string | (() => string);
  elementId?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CopyToClipboardButton({
  plainText,
  html,
  children = "Copy",
  className = "",
  elementId,
}: Props) {
  let [isCopied, setIsCopied] = useState(false);
  useEffect(() => {
    if (isCopied) {
      let timeout = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isCopied]);

  let handleCopy = async () => {
    setIsCopied(true);
    if (html) {
      await copyHtmlToClipboard(
        typeof html === "function" ? html() : html,
        typeof plainText === "string" ? plainText : undefined
      );
    } else if (elementId) {
      let element = document.getElementById(elementId);
      if (element) {
        await copyHtmlToClipboard(
          element.innerHTML,
          typeof plainText === "string" ? plainText : undefined
        );
      }
    }
    if (plainText) {
      await navigator.clipboard.writeText(
        typeof plainText === "function" ? plainText() : plainText
      );
    }
  };

  return (
    <>
      {isCopied ? (
        <Button
          variant="ghost"
          type="button"
          className={cn("btn btn-ghost", className)}
          onClick={handleCopy}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
            <path d="M9 14l2 2l4 -4"></path>
          </svg>
          <span className="text-sm font-medium">Copied!</span>
          <span className="sr-only">Copy</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          type="button"
          className={cn("btn btn-ghost", className)}
          onClick={handleCopy}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
          </svg>
          <span className="text-sm font-medium">{children}</span>
          <span className="sr-only">Copy</span>
        </Button>
      )}
    </>
  );
}
