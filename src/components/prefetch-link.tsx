"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import type { ComponentProps } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link>;

export function PrefetchLink({ href, children, ...props }: PrefetchLinkProps) {
  const router = useRouter();
  const prefetched = useRef(false);

  const triggerPrefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(typeof href === "string" ? href : href.pathname ?? "");
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={triggerPrefetch}
      onFocus={triggerPrefetch}
      {...props}
    >
      {children}
    </Link>
  );
}
