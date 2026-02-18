"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { PrefetchLink } from "@/components/prefetch-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/constants";
import { useProduct } from "@/hooks/use-product";
import { useCartStore } from "@/store/cart-store";
import { LocalTime } from "@/components/local-time";
import type { ProductDetailData } from "@/lib/types";

interface ProductDetailClientProps {
  productId: number;
  initialData: ProductDetailData;
  requestNonce?: string;
}

export function ProductDetailClient({ productId, initialData, requestNonce }: ProductDetailClientProps) {
  const { data } = useProduct(productId, initialData, requestNonce);
  const addItem = useCartStore((store) => store.addItem);
  const cartItems = useCartStore((store) => store.items);

  const product = data?.product ?? initialData.product;
  const events = data?.events ?? initialData.events;

  const icon = getCategoryIcon(product.category?.name);
  const isOutOfStock = product.stock === 0;
  const stockPct = isOutOfStock ? 0 : Math.min(100, Math.max(8, (product.stock / 60) * 100));
  const stockColor = isOutOfStock
    ? "bg-destructive"
    : product.stock > 20
      ? "bg-success"
      : product.stock > 5
        ? "bg-warning"
        : "bg-destructive";

  const cartItem = cartItems.find((cartItemEntry) => cartItemEntry.productId === product.id);
  const inCart = cartItem?.quantity ?? 0;
  const maxQty = Math.max(0, product.stock - inCart);
  const [qty, setQty] = useState(1);
  const maxSelectableQty = Math.max(1, maxQty);
  const clampedQty = Math.min(qty, maxSelectableQty);

  const isAtLimit = maxQty <= 0;

  function handleAddToCart() {
    if (isAtLimit) return;
    const added = addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: clampedQty,
      maxStock: product.stock,
      categoryName: product.category?.name ?? null,
    });
    if (added) {
      toast.success(`${clampedQty}x "${product.name}" adicionado ao carrinho`);
      setQty(1);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in">
        <PrefetchLink href="/products" className="link-glow">Produtos</PrefetchLink>
        <span className="opacity-40">/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 animate-in delay-1">
        <div className="lg:col-span-2">
          <div className="relative product-img-placeholder h-48 sm:h-64 rounded-2xl border border-border flex items-center justify-center">
            <span className="text-7xl">{icon}</span>
            {isOutOfStock && (
              <span className="absolute top-3 right-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white">
                Esgotado
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {product.category?.name ?? "Sem categoria"}
              </span>
              {isOutOfStock && (
                <span className="inline-flex items-center rounded-full bg-destructive/20 border border-destructive/30 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  Esgotado
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{product.name}</h1>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-[rgba(34,211,238,0.1)] to-[rgba(79,125,255,0.06)] border border-[rgba(34,211,238,0.15)] p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Preço atual</div>
            <div className="text-4xl font-extrabold text-accent-cyan neon-text-cyan">
              R$ {product.price.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Estoque</div>
              <div className="text-2xl font-bold mb-2">{product.stock} <span className="text-sm font-normal text-muted-foreground">unidades</span></div>
              <div className="stock-bar">
                <div className={`stock-bar-fill ${stockColor}`} style={{ width: `${stockPct}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Atualizado em</div>
              <LocalTime date={product.updatedAt} format="date" className="text-sm font-mono text-foreground" />
              <LocalTime date={product.updatedAt} format="time" className="text-xs font-mono text-muted-foreground mt-1 block" />
            </div>
          </div>

          {/* Add to Cart */}
          <div className="rounded-xl border border-border bg-card p-4 backdrop-blur-xl space-y-3">
            {isOutOfStock ? (
              <Button disabled className="w-full">
                Esgotado
              </Button>
            ) : isAtLimit ? (
              <>
                <Button disabled className="w-full">
                  Limite de compra atingido
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Você já adicionou todo o estoque disponível ({inCart}/{product.stock}).
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty((currentQty) => Math.max(1, Math.min(currentQty - 1, maxSelectableQty)))}
                      disabled={clampedQty <= 1}
                      className="h-10 w-10 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[rgba(79,125,255,0.3)] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-mono font-semibold">{clampedQty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((currentQty) => Math.min(maxSelectableQty, currentQty + 1))}
                      disabled={clampedQty >= maxQty}
                      className="h-10 w-10 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[rgba(79,125,255,0.3)] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button onClick={handleAddToCart} className="flex-1 gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
                {inCart > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {inCart} un. no carrinho — restam {maxQty} disponíveis
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Card className="animate-in delay-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent-purple shadow-[0_0_10px_var(--accent-purple)] animate-pulse" />
            Histórico de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {events.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum evento registrado para este produto.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-2 top-4 bottom-4 w-px bg-linear-to-b from-accent-purple via-primary to-transparent opacity-25" />

              {events.map((event, i) => (
                <div key={event.id} className={`relative flex gap-4 py-3 animate-in delay-${Math.min(i + 1, 5)}`}>
                  <div className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-accent-purple bg-background shadow-[0_0_8px_var(--accent-purple)]" />
                  <div className="event-card flex-1 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(17,27,46,0.3)] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-accent-cyan">{event.type}</span>
                      <span className="text-xs text-muted-foreground font-mono ml-auto">
                        <LocalTime date={event.createdAt} format="time" />
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
