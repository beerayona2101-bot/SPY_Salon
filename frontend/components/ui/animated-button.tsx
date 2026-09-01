"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    children?: React.ReactNode;
    as?: any;
    href?: string;
    [key: string]: any;
  };

/**
 * AnimatedButton
 * - theme-aware: uses Tailwind `dark:` classes so it works in both light and dark mode
 * - accepts all native button props (onClick, className, type, etc.)
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children = "Browse Components",
  className = "",
  as = "button",
  ...rest
}) => {
  const Component = React.useMemo(() => {
    if (typeof as === "string") {
      return (motion as any)[as] || motion.button;
    }
    return (motion as any).create ? (motion as any).create(as) : (motion as any)(as);
  }, [as]);

  return (
    <Component
      {...rest}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      className={cn(
        "group inline-flex items-center justify-center relative overflow-hidden transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "[--shine:rgba(255,255,255,0.7)]",
        className
      )}
    >
      {/* Solid Crisp Text Layer (Zero Ghosting/Double-Text) */}
      <span className="relative z-10 flex items-center justify-center w-full h-full">
        {children}
      </span>

      {/* Border shine effect uses the --shine variable */}
      <motion.span
        className="block absolute inset-0 rounded-[inherit] p-px pointer-events-none z-20"
        style={{
          background:
            "linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
        }}
        initial={{ backgroundPosition: "100% 0", opacity: 0 }}
        animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1,
        }}
      />
    </Component>
  );
};

export default AnimatedButton;
