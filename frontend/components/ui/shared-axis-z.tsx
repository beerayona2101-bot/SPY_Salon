"use client";

import React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface SharedAxisZProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  isExpanded?: boolean;
  className?: string;
}

/**
 * SharedAxisZ (SmoothUI / Framer Motion Depth Animation)
 *
 * Provides a sleek Z-axis motion transition for hero components and card cards.
 */
export function SharedAxisZ({
  children,
  isExpanded = true,
  className,
  ...props
}: SharedAxisZProps) {
  return (
    <AnimatePresence mode="wait">
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, z: -50 }}
          animate={{ opacity: 1, scale: 1, z: 0 }}
          exit={{ opacity: 0, scale: 1.08, z: 50 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn("w-full", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SharedAxisZ;
