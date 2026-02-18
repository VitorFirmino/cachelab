import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { ProductsContent } from "./products-content";

function ProductsLoading() {
  return (
    <div className="space-y-8">
      <div className="section-line animate-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
      <div className="flex gap-2 animate-in delay-1">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`rounded-2xl border border-border bg-card overflow-hidden animate-in delay-${Math.min(i + 2, 8)}`}>
            <Skeleton className="h-24 w-full rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-1 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProductsPageProps {
  searchParams?: Promise<{ page?: string; category?: string; query?: string; q?: string; checkout?: string; _r?: string }>;
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent searchParams={searchParams!} />
    </Suspense>
  );
}
