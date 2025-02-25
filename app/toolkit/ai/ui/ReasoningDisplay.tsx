import { useRef, useState } from "react";

export const ReasoningDisplay = ({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? true);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Handle toggle events to track user's choice
  const handleToggle = () => {
    if (detailsRef.current) {
      setIsOpen(detailsRef.current.open);
    }
  };

  return (
    <details
      ref={detailsRef}
      open={isOpen}
      onToggle={handleToggle}
      className="mb-4 mt-0 border-l-2 border-base-300/80 "
    >
      <summary className="py-2 pl-4 text-sm font-medium cursor-pointer hover:bg-base-200">
        Reasoning
      </summary>
      <div className="pl-4 pr-4 pb-2 max-h-96 overflow-auto">{children}</div>
    </details>
  );
};
