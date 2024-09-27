import React from "react";
import { Drawer } from "vaul";
import { ScrollArea } from "~/shadcn/components/ui/scroll-area";
import { cn } from "~/shadcn/utils";

export interface DrawerProps {
  isOpen: boolean;
  children: React.ReactNode | React.ReactNode[];
  onClose: () => void;
  direction?: "left" | "right" | "top" | "bottom";
  className?: string;
}

export const MyDrawer = ({
  isOpen,
  children,
  onClose,
  direction = "right",
  className,
}: DrawerProps) => {
  return (
    <Drawer.Root
      direction={direction}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className={cn(
            "bg-white flex flex-col fixed outline-none py-8 px-8 ",
            direction === "left" && "left-0",
            direction === "right" && "right-0 bottom-0 top-0 rounded-l-lg",
            direction === "top" && "top-0",
            direction === "bottom" && "bottom-0",
            className
          )}
        >
          <ScrollArea>{children}</ScrollArea>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
