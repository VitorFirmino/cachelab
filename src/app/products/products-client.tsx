"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PrefetchLink } from "@/components/prefetch-link";
import { getCategoryIcon } from "@/lib/constants";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import type { Category, ProductsPageData } from "@/lib/types";

function buildUrl(params: { page?: number; categoryId?: number; query?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  if (params.categoryId) searchParams.set("category", String(params.categoryId));
  if (params.query) searchParams.set("query", params.query);
  const queryString = searchParams.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

interface ProductsClientProps {
  initialProducts: ProductsPageData;
  initialCategories: Category[];
  page: number;
  pageSize: number;
  categoryId?: number;
  query: string;
}

export function ProductsClient({
  initialProducts,
  initialCategories,
  page: initialPage,
  pageSize,
  categoryId: initialCategoryId,
  query: initialQuery,
}: ProductsClientProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentCategoryId, setCurrentCategoryId] = useState(initialCategoryId);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: productsData, isLoading } = useProducts(
    { page: currentPage, pageSize, categoryId: currentCategoryId, query: currentQuery || undefined },
    initialProducts,
  );
  const { data: categories } = useCategories(initialCategories);

  const items = productsData?.items ?? [];
  const total = productsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cats = categories ?? [];

  useEffect(() => {
    const url = buildUrl({ page: currentPage, categoryId: currentCategoryId, query: currentQuery });
    window.history.replaceState(null, "", url);
  }, [currentPage, currentCategoryId, currentQuery]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed !== currentQuery) {
        setCurrentQuery(trimmed);
        setCurrentPage(1);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputValue, currentQuery]);

  const handleCategoryChange = useCallback((categoryId?: number) => {
    setCurrentCategoryId(categoryId);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentCategoryId(undefined);
    setCurrentQuery("");
    setInputValue("");
    setCurrentPage(1);
  }, []);

  const hasFilters = currentCategoryId || currentQuery;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-in">
        <div className="section-line">
          <h1 className="text-3xl font-extrabold gradient-text">Catálogo de Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} produtos encontrados
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 animate-in delay-1">
        <button
          type="button"
          onClick={() => handleCategoryChange(undefined)}
          className={`category-chip inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${!currentCategoryId ? "border-[rgba(79,125,255,0.4)] bg-[rgba(79,125,255,0.12)] text-primary" : "border-border text-muted-foreground hover:border-[rgba(79,125,255,0.2)]"}`}
        >
          Todos
        </button>
        {cats.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`category-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${currentCategoryId === cat.id ? "border-[rgba(79,125,255,0.4)] bg-[rgba(79,125,255,0.12)] text-primary" : "border-border text-muted-foreground hover:border-[rgba(79,125,255,0.2)]"}`}
          >
            <span>{getCategoryIcon(cat.name)}</span>
            {cat.name}
          </button>
        ))}
      </div>

      <Card className={`animate-in delay-2 ${isLoading ? "border-beam" : ""}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar produto..."
              value={inputValue}
              aria-label="Buscar produto"
              className="max-w-[260px]"
              onChange={(e) => setInputValue(e.target.value)}
            />
            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-primary link-glow cursor-pointer"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl border border-border bg-card overflow-hidden animate-in delay-${Math.min(i + 2, 8)}`}
              >
                <Skeleton className="h-24 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-2.5 w-16" />
                      <Skeleton className="h-2.5 w-10" />
                    </div>
                    <Skeleton className="h-1 w-full" />
                  </div>
                </div>
              </div>
            ))
          : items.map((product, i) => {
              const icon = getCategoryIcon(product.category?.name);
              const stockPct = Math.min(100, Math.max(8, (product.stock / 60) * 100));
              const stockColor = product.stock > 20
                ? "bg-success"
                : product.stock > 5
                  ? "bg-warning"
                  : "bg-destructive";

              return (
                <PrefetchLink
                  key={product.id}
                  href={`/product/${product.id}`}
                  className={`product-card block rounded-2xl border border-border bg-card backdrop-blur-xl animate-in delay-${Math.min(i + 2, 8)}`}
                >
                  <div className="card-shine" />

                  <div className="product-img-placeholder h-24 rounded-t-2xl flex items-center justify-center">
                    <span className="text-3xl">{icon}</span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {product.category?.name ?? "Sem categoria"}
                        </p>
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        #{product.id}
                      </span>
                    </div>

                    <div className="price-tag">
                      <span className="text-base font-bold text-accent-cyan">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{product.stock > 20 ? "Em estoque" : product.stock > 5 ? "Estoque baixo" : "Quase esgotado"}</span>
                        <span className="font-mono">{product.stock} un.</span>
                      </div>
                      <div className="stock-bar">
                        <div className={`stock-bar-fill ${stockColor}`} style={{ width: `${stockPct}%` }} />
                      </div>
                    </div>
                  </div>
                </PrefetchLink>
              );
            })}
      </div>

      <div className="flex items-center justify-between animate-in delay-3">
        <div className="text-sm text-muted-foreground">
          Página <span className="text-foreground font-semibold">{currentPage}</span> de <span className="text-foreground font-semibold">{totalPages}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            className={`cta-btn rounded-lg border border-[rgba(79,125,255,0.2)] bg-[rgba(17,27,46,0.6)] px-4 py-2 text-sm font-medium transition-all cursor-pointer ${currentPage <= 1 ? "pointer-events-none opacity-30" : "hover:border-[rgba(79,125,255,0.4)]"}`}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            className={`cta-btn rounded-lg border border-[rgba(79,125,255,0.2)] bg-[rgba(17,27,46,0.6)] px-4 py-2 text-sm font-medium transition-all cursor-pointer ${currentPage >= totalPages ? "pointer-events-none opacity-30" : "hover:border-[rgba(79,125,255,0.4)]"}`}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
