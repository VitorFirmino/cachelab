"use client";

import { Package } from "lucide-react";

import { PrefetchLink } from "@/components/prefetch-link";
import { EmptyState } from "@/components/empty-state";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getCategoryIcon } from "@/lib/constants";
import { useFeatured } from "@/hooks/use-featured";
import type { FeaturedData } from "@/lib/types";

function getStockLevel(stock: number) {
  if (stock === 0) return { pct: 0, color: "bg-destructive", label: "Esgotado" };
  if (stock > 50) return { pct: 100, color: "bg-success", label: "Em estoque" };
  if (stock > 20) return { pct: 70, color: "bg-success", label: "Em estoque" };
  if (stock > 5) return { pct: 40, color: "bg-warning", label: "Estoque baixo" };
  return { pct: 15, color: "bg-destructive", label: "Quase esgotado" };
}

interface FeaturedGridProps {
  initialFeatured: FeaturedData;
}

export function FeaturedGrid({ initialFeatured }: FeaturedGridProps) {
  const { data: featured } = useFeatured(initialFeatured);

  const products = featured?.products ?? [];

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="Nenhum produto em destaque"
        description="Cadastre produtos no painel admin para vê-los aqui."
        action={
          <PrefetchLink
            href="/products"
            className="cta-btn inline-flex items-center rounded-lg border border-[rgba(79,125,255,0.3)] bg-[rgba(17,27,46,0.6)] px-4 py-2 text-sm font-medium transition-all hover:border-[rgba(79,125,255,0.5)]"
          >
            Ver catálogo
          </PrefetchLink>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, i) => {
        const stock = getStockLevel(product.stock);
        const icon = getCategoryIcon(product.category?.name);
        return (
          <PrefetchLink
            key={product.id}
            href={`/product/${product.id}`}
            className={`product-card block rounded-2xl border border-border bg-card backdrop-blur-xl animate-in delay-${Math.min(i + 2, 8)}`}
          >
            <div className="card-shine" />

            <div className="relative product-img-placeholder h-32 rounded-t-2xl flex items-center justify-center">
              <span className="text-4xl">{icon}</span>
              {product.stock === 0 && (
                <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                  Esgotado
                </span>
              )}
            </div>

            <div className="p-5 space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {product.category?.name ?? "Sem categoria"}
                </div>
                <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
              </div>

              <div className="price-tag">
                <span className="text-lg font-bold text-accent-cyan">
                  R$ {product.price.toFixed(2)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{stock.label}</span>
                  <span className="font-mono">{product.stock} un.</span>
                </div>
                <div className="stock-bar">
                  <div className={`stock-bar-fill ${stock.color}`} style={{ width: `${stock.pct}%` }} />
                </div>
              </div>

              <AddToCartButton product={product} />
            </div>
          </PrefetchLink>
        );
      })}
    </div>
  );
}
