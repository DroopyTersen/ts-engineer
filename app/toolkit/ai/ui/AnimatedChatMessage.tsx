import { motion } from "framer-motion";
import { cn } from "~/toolkit/components/utils";

export function AnimatedChatMessage({
  role,
  index,
  children,
  id,
  className = "",
}: {
  index: number;
  role: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      key={id || index}
      initial={{
        opacity: 0,
        scale: 0.95,
        y: role === "user" ? 20 : -20,
      }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.15,
        y: {
          duration: 0.2,
          type: "spring",
          bounce: 0.25,
        },
        opacity: {
          duration: 0.25,
          type: "tween",
          ease: "easeOut",
        },
        delay: index * 0.1,
      }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
