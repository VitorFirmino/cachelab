"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, ShoppingCart } from "lucide-react";

import { PrefetchLink } from "@/components/prefetch-link";
import { CacheLabMark } from "@/components/cachelab-mark";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCartStore, totalItems } from "@/store/cart-store";

const CartSheet = dynamic(
  () => import("@/components/cart-sheet").then((mod) => mod.CartSheet),
  { ssr: false },
);

export function NavBar() {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutNonce, setCheckoutNonce] = useState("");
  const items = useCartStore((store) => store.items);
  const count = totalItems(items);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncNonceFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      setCheckoutNonce(params.get("checkout")?.trim() || params.get("_r")?.trim() || "");
    };
    const onCheckoutNonce = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCheckoutNonce(customEvent.detail || "");
    };

    syncNonceFromLocation();
    window.addEventListener("popstate", syncNonceFromLocation);
    window.addEventListener("cachelab:checkout-nonce", onCheckoutNonce);

    return () => {
      window.removeEventListener("popstate", syncNonceFromLocation);
      window.removeEventListener("cachelab:checkout-nonce", onCheckoutNonce);
    };
  }, []);

  const withCheckout = (href: string) => {
    if (!checkoutNonce) return href;
    if (href !== "/" && href !== "/products") return href;
    const params = new URLSearchParams({ checkout: checkoutNonce });
    return `${href}?${params.toString()}`;
  };

  const navItems = [
    { href: withCheckout("/"), label: "Início" },
    { href: withCheckout("/products"), label: "Produtos" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[rgba(6,9,15,0.7)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <PrefetchLink href="/" className="flex items-center gap-3 group">
          <CacheLabMark className="h-10 w-10 drop-shadow-[0_0_24px_rgba(79,125,255,0.4)] transition-all duration-300 group-hover:drop-shadow-[0_0_32px_rgba(79,125,255,0.6)] group-hover:scale-105" />
          <div>
            <div className="text-base font-bold tracking-tight neon-text transition-all duration-300">CacheLab</div>
            <div className="text-xs text-muted-foreground tracking-wide uppercase">Sua loja inteligente</div>
          </div>
        </PrefetchLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <PrefetchLink
                key={item.href}
                href={item.href}
                className="link-glow rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[rgba(79,125,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {item.label}
              </PrefetchLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative ml-2 rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[rgba(79,125,255,0.08)] cursor-pointer"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[rgba(79,125,255,0.08)] cursor-pointer"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[rgba(79,125,255,0.08)] cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-linear-to-r from-transparent via-\1 to-transparent opacity-30" />

      {/* Mobile drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent>
          <SheetHeader>
            <div className="flex items-center gap-3">
              <CacheLabMark className="h-8 w-8 drop-shadow-[0_0_24px_rgba(79,125,255,0.4)]" />
              <SheetTitle className="neon-text">CacheLab</SheetTitle>
            </div>
            <SheetDescription>Navegação do site</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-2 pt-6">
            {navItems.map((item) => (
              <PrefetchLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg py-3 px-4 text-base text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[rgba(79,125,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {item.label}
              </PrefetchLink>
            ))}
          </nav>

          <div className="mx-4 my-4 h-px bg-[rgba(79,125,255,0.15)]" />

          <div className="px-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCartOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-lg py-3 px-4 text-base text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-[rgba(79,125,255,0.08)] cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Abrir Carrinho</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {cartOpen ? <CartSheet open={cartOpen} onOpenChange={setCartOpen} /> : null}
    </header>
  );
}
