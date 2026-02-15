"use client";

import { PrefetchLink } from "@/components/prefetch-link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/constants";
import { useProduct } from "@/hooks/use-product";
import type { ProductDetailData } from "@/lib/types";

interface ProductDetailClientProps {
  productId: number;
  initialData: ProductDetailData;
}

export function ProductDetailClient({ productId, initialData }: ProductDetailClientProps) {
  const { data } = useProduct(productId, initialData);

  const product = data?.product ?? initialData.product;
  const events = data?.events ?? initialData.events;

  const icon = getCategoryIcon(product.category?.name);
  const stockPct = Math.min(100, Math.max(8, (product.stock / 60) * 100));
  const stockColor = product.stock > 20
    ? "bg-success"
    : product.stock > 5
      ? "bg-warning"
      : "bg-destructive";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in">
        <PrefetchLink href="/products" className="link-glow">Produtos</PrefetchLink>
        <span className="opacity-40">/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 animate-in delay-1">
        <div className="lg:col-span-2">
          <div className="product-img-placeholder h-64 rounded-2xl border border-border flex items-center justify-center">
            <span className="text-7xl">{icon}</span>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {product.category?.name ?? "Sem categoria"}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{product.name}</h1>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-[rgba(34,211,238,0.1)] to-[rgba(79,125,255,0.06)] border border-[rgba(34,211,238,0.15)] p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Preço atual</div>
            <div className="text-4xl font-extrabold text-accent-cyan neon-text-cyan">
              R$ {product.price.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Estoque</div>
              <div className="text-2xl font-bold mb-2">{product.stock} <span className="text-sm font-normal text-muted-foreground">unidades</span></div>
              <div className="stock-bar">
                <div className={`stock-bar-fill ${stockColor}`} style={{ width: `${stockPct}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Atualizado em</div>
              <div className="text-sm font-mono text-foreground">{new Date(product.updatedAt).toISOString().split("T")[0]}</div>
              <div className="text-xs font-mono text-muted-foreground mt-1">{new Date(product.updatedAt).toISOString().split("T")[1]?.slice(0, 8) ?? ""}</div>
            </div>
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
              <div className="absolute left-[7px] top-4 bottom-4 w-px bg-linear-to-b from-accent-purple via-primary to-transparent opacity-25" />

              {events.map((event, i) => (
                <div key={event.id} className={`relative flex gap-4 py-3 animate-in delay-${Math.min(i + 1, 5)}`}>
                  <div className="relative z-10 mt-1.5 h-[14px] w-[14px] shrink-0 rounded-full border-2 border-accent-purple bg-background shadow-[0_0_8px_var(--accent-purple)]" />
                  <div className="event-card flex-1 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(17,27,46,0.3)] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-accent-cyan">{event.type}</span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                        {new Date(event.createdAt).toISOString().split("T")[1]?.slice(0, 8) ?? ""}
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
