import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted text-foreground",
        primary:
          "border-[rgba(79,125,255,0.3)] bg-[rgba(79,125,255,0.15)] text-primary shadow-[0_0_10px_rgba(79,125,255,0.2)]",
        success:
          "border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.15)] text-success shadow-[0_0_10px_rgba(34,197,94,0.2)]",
        warning:
          "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]",
        destructive:
          "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-destructive shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        outline:
          "border-[rgba(255,255,255,0.15)] bg-transparent text-foreground",
        neon:
          "border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.1)] text-accent-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
