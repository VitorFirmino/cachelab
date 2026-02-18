"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link>;

export function PrefetchLink({ href, children, ...props }: PrefetchLinkProps) {
  return (
    <Link href={href} prefetch={false} {...props}>
      {children}
    </Link>
  );
}
