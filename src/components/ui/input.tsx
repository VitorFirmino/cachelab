import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-[rgba(17,27,46,0.5)] px-3 py-2 text-sm text-foreground backdrop-blur-sm placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:border-[rgba(79,125,255,0.5)] focus-visible:shadow-[0_0_0_2px_rgba(79,125,255,0.15),0_0_15px_rgba(79,125,255,0.1)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
