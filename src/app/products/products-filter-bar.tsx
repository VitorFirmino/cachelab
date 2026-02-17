"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { PrefetchLink } from "@/components/prefetch-link";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QueryParams {
  page?: number;
  categoryId?: number;
  query?: string;
}

function buildQueryString({ page, categoryId, query }: QueryParams) {
  const params = new URLSearchParams();
  if (page && page > 1) params.set("page", String(page));
  if (categoryId) params.set("category", String(categoryId));
  if (query) params.set("query", query);
  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

interface ProductsFilterBarProps {
  categoryId?: number;
  initialQuery?: string;
}

export function ProductsFilterBar({ categoryId, initialQuery }: ProductsFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery ?? "");

  const resetHref = useMemo(
    () => buildQueryString({ categoryId }),
    [categoryId],
  );

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = setTimeout(() => {
      startTransition(() => {
        router.replace(buildQueryString({ categoryId, query: trimmed }));
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, categoryId, router]);

  return (
    <Card className="animate-in delay-2">
      <CardContent className="py-4">
        <form
          className="flex items-center gap-3"
          action={buildQueryString({ categoryId })}
        >
          <Input
            name="query"
            placeholder="Buscar produto..."
            defaultValue={query}
            aria-label="Buscar produto"
            className="max-w-64"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Filtrar
          </Button>
          {(categoryId || query) && (
            <PrefetchLink href={resetHref} className="text-xs text-primary link-glow">
              Limpar filtro
            </PrefetchLink>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
