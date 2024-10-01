import { Send } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "~/shadcn/components/ui/button";
import { Input } from "~/shadcn/components/ui/input";
import { Textarea } from "~/shadcn/components/ui/textarea";
import { cn } from "~/shadcn/utils";

// Define a custom type for the imperative handle
type ImperativeHandle = {
  setInputValue: (value: string) => void;
  setInputFocus: () => void;
};

export const DynamicMessageInput = forwardRef<
  ImperativeHandle,
  {
    handleSubmit: (userInput: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
  }
>(
  (
    {
      handleSubmit,
      placeholder = "Enter your message...",
      autoFocus = false,
      className,
    },
    ref
  ) => {
    const [inputText, setInputText] = useState("");
    const [isTextarea, setIsTextarea] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cursorPositionRef = useRef<number>(0);
    useImperativeHandle(ref, () => ({
      setInputValue: (value: string) => {
        setInputText(value);
      },
      setInputFocus: () => {
        // @ts-ignore
        textAreaRef.current?.focus();
      },
    }));
    useEffect(() => {
      if ((inputText.length > 100 || inputText.includes("\n")) && !isTextarea) {
        setIsTextarea(true);
      } else if (
        inputText.length <= 100 &&
        isTextarea &&
        !inputText.includes("\n")
      ) {
        setIsTextarea(false);
      }
    }, [inputText, isTextarea]);

    useEffect(() => {
      const focusAndSetCursor = (
        element: HTMLInputElement | HTMLTextAreaElement
      ) => {
        element.focus();
        element.setSelectionRange(
          cursorPositionRef.current,
          cursorPositionRef.current
        );
      };

      if (isTextarea && textareaRef.current) {
        focusAndSetCursor(textareaRef.current);
      } else if (!isTextarea && inputRef.current) {
        focusAndSetCursor(inputRef.current);
      }
    }, [isTextarea]);

    const handleSendMessage = () => {
      if (inputText.trim()) {
        handleSubmit(inputText.trim());
        cursorPositionRef.current = 0;
        setInputText("");
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.shiftKey && !isTextarea) {
        e.preventDefault();
        setInputText((prev) => prev + "\n");
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setInputText(e.target.value);
      cursorPositionRef.current = e.target.selectionStart || 0;
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      const pasteData = e.clipboardData.getData("text");
      if (pasteData.includes("\n")) {
        setIsTextarea(true);
      }
    };

    return (
      <div className={cn("relative rounded-full", className)}>
        {!isTextarea ? (
          <Input
            autoFocus={autoFocus}
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste} // Add onPaste event handler
            placeholder={placeholder}
            className={`pr-20 rounded-full transition-all duration-200 ease-in-out ${
              inputText.length > 60
                ? "text-base h-10"
                : inputText.length > 30
                ? "text-lg h-12 pl-4"
                : "text-xl h-14 pl-5"
            }`}
          />
        ) : (
          <Textarea
            autoFocus={autoFocus}
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste} // Add onPaste event handler
            placeholder={placeholder}
            className="pr-20 rounded-lg transition-all duration-200 ease-in-out text-base resize-y"
            style={
              {
                maxHeight: "30vh",
                fieldSizing: "content",
              } as any
            }
          />
        )}
        <Button
          onClick={handleSendMessage}
          className={cn(
            `absolute right-0 top-1/2 transform -translate-y-1/2 rounded-full px-3 ${
              inputText.length > 60
                ? "h-10"
                : inputText.length > 30
                ? "h-12"
                : "h-14 w-28"
            }`,
            isTextarea && "rounded-md right-5 bottom-0 top-auto -mb-4 w-14"
          )}
        >
          <Send className="w-4 h-4 mr-1" />
          {!isTextarea && "Send"}
        </Button>
      </div>
    );
  }
);
