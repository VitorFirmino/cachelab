import { Suspense } from "react";

import { PrefetchLink } from "@/components/prefetch-link";
import { Skeleton } from "@/components/ui/skeleton";

import { FeaturedProducts } from "./featured-products";

function FeaturedSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl border border-border bg-card overflow-hidden animate-in delay-${Math.min(i + 2, 8)}`}
        >
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-1 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-14">

      <section className="animate-in relative py-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.06)] px-3 py-1 text-xs font-medium text-accent-cyan mb-4">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_var(--accent-cyan)] animate-pulse" />
            Loja Online
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl leading-none mb-4">
            <span className="gradient-text">CacheLab</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
            Descubra os melhores produtos com preços atualizados em tempo real.
          </p>
        </div>
      </section>

      <section className="animate-in delay-2">
        <div className="flex items-end justify-between mb-6">
          <div className="section-line">
            <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
          </div>
        </div>

        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      <section className="animate-in delay-3">
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-[rgba(79,125,255,0.15)] bg-card p-6 sm:p-8 backdrop-blur-xl overflow-hidden">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[rgba(79,125,255,0.08)] blur-3xl" aria-hidden="true" />

          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-1">Explore o catálogo completo</h3>
            <p className="text-sm text-muted-foreground">
              Navegue por todos os produtos com paginação, filtros e cache ISR.
            </p>
          </div>

          <PrefetchLink
            href="/products"
            className="cta-btn relative z-10 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white whitespace-nowrap"
          >
            Ver Produtos
          </PrefetchLink>
        </div>
      </section>
    </div>
  );
}
