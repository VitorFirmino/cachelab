import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:opacity-90 hover:shadow-[0_0_20px_rgba(79,125,255,0.3)]",
        secondary:
          "bg-card-solid text-foreground hover:opacity-90 border border-border hover:border-[rgba(79,125,255,0.3)] hover:shadow-[0_0_15px_rgba(79,125,255,0.1)]",
        ghost: "hover:bg-muted",
        outline:
          "border border-[rgba(79,125,255,0.3)] bg-transparent text-foreground hover:bg-[rgba(79,125,255,0.1)] hover:shadow-[0_0_15px_rgba(79,125,255,0.15)]",
        destructive:
          "bg-destructive text-white hover:opacity-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
