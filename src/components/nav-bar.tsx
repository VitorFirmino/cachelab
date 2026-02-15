"use client";

import { PrefetchLink } from "@/components/prefetch-link";
import { CacheLabMark } from "@/components/cachelab-mark";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/products", label: "Produtos" },
  { href: "/admin", label: "Admin" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[color:rgba(6,9,15,0.7)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <PrefetchLink href="/" className="flex items-center gap-3 group">
          <CacheLabMark className="h-10 w-10 drop-shadow-[0_0_24px_rgba(79,125,255,0.4)] transition-all duration-300 group-hover:drop-shadow-[0_0_32px_rgba(79,125,255,0.6)] group-hover:scale-105" />
          <div>
            <div className="text-base font-bold tracking-tight neon-text transition-all duration-300">CacheLab</div>
            <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Sua loja inteligente</div>
          </div>
        </PrefetchLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <PrefetchLink
              key={item.href}
              href={item.href}
              className="link-glow rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[color:rgba(79,125,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
            >
              {item.label}
            </PrefetchLink>
          ))}
        </nav>
      </div>

      <div className="h-px w-full bg-linear-to-r from-transparent via-[color:var(--primary)] to-transparent opacity-30" />

      <div className="flex w-full items-center justify-center gap-1 bg-[color:rgba(6,9,15,0.5)] px-4 py-2 backdrop-blur-sm md:hidden">
        {navItems.map((item) => (
          <PrefetchLink
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-all hover:text-foreground hover:bg-[color:rgba(79,125,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
          >
            {item.label}
          </PrefetchLink>
        ))}
      </div>
    </header>
  );
}
