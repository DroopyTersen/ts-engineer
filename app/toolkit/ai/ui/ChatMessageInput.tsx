import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Textarea } from "~/toolkit/components/forms";

import { forwardRef } from "react";

export const ChatMessageInput = forwardRef<
  HTMLTextAreaElement,
  {
    handleSubmit: (userInput: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
  }
>(
  (
    { handleSubmit, placeholder = "Enter your message...", autoFocus = false },
    ref
  ) => {
    let textAreaRef = useRef<HTMLTextAreaElement>(null);
    let [input, setInput] = useState("");
    // Exposing a method to imperatively set the input value using useImperativeHandle
    useImperativeHandle(ref, () => ({
      setInputValue: (value: string) => {
        setInput(value);
        // Ensure the textarea height is updated when the input is set programmatically
        updateHeight();
      },
      setInputFocus: () => {
        // @ts-ignore
        textAreaRef.current?.focus();
      },
    }));

    const updateHeight = () => {
      if (textAreaRef.current) {
        const current: HTMLTextAreaElement =
          textAreaRef.current as HTMLTextAreaElement;

        // Temporarily set height to 'auto' to allow scrollHeight to shrink
        // @ts-ignore
        textAreaRef.current.style.height = "auto";
        // Set the height to the scrollHeight
        // @ts-ignore
        textAreaRef.current.style.height =
          // @ts-ignore
          textAreaRef.current.scrollHeight + "px";
      }
    };

    useEffect(() => {
      updateHeight();
    }, []);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input) handleSubmit(input);
          setInput("");
          // @ts-ignore
          textAreaRef.current?.focus();
        }}
        className="mt-2"
      >
        <label htmlFor="chat-input" className="sr-only">
          Enter your prompt
        </label>
        <div className="relative flex items-center">
          <Textarea
            // @ts-ignore
            ref={textAreaRef}
            id="chat-input"
            className="block w-full resize-none rounded-xl p-4 text-sm shadow-sm min-h-[54px] focus:textarea-primary pr-24 overflow-hidden"
            placeholder={placeholder}
            required
            autoFocus={autoFocus}
            value={input}
            rows={1}
            onChange={(e) => {
              // @ts-ignore
              setInput(e.currentTarget.value);
              updateHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && input) {
                // trigger a form submission on the parent form
                e.preventDefault();
                handleSubmit?.(input);
                setInput("");
              }
            }}
          ></Textarea>
          <button
            type="submit"
            className="absolute top-2 bottom-2 right-2 btn btn-primary h-auto min-h-0"
          >
            Send <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
    );
  }
);
