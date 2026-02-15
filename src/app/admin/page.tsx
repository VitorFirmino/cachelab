import { PrefetchLink } from "@/components/prefetch-link";

import { AdminClient } from "@/app/admin/admin-client";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/service/data";
import { prisma } from "@/lib/prisma";
import { ArrowRight, BarChart3 } from "lucide-react";

export default async function AdminPage() {
  const user = await requireAdmin();
  const categories = await getCategories();
  const products = await prisma.product
    .findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    .catch(() => []);

  return (
    <div className="space-y-8">
      <div className="animate-in">
        <div className="section-line">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold gradient-text">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie produtos e eventos — todas as mutações invalidam o cache automaticamente
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
              <a
                href="/logout"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-destructive hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.08)]"
              >
                Sair
              </a>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <PrefetchLink
            href="/admin/stats"
            className="group block rounded-2xl border border-border bg-[color:var(--card)] p-5 backdrop-blur-xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-[rgba(79,125,255,0.25)] hover:shadow-[0_0_30px_rgba(79,125,255,0.1),0_8px_32px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(79,125,255,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-[rgba(79,125,255,0.08)] text-primary shadow-[0_0_18px_rgba(79,125,255,0.12)]">
                  <BarChart3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-success shadow-[0_0_6px_var(--success)]" />
                    <span className="text-sm font-semibold text-foreground">Estatísticas</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Uptime, eventos (24h) e controles para purgar cache por tag.
                  </p>
                </div>
              </div>

              <ArrowRight
                className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden="true"
              />
            </div>
          </PrefetchLink>
        </div>
      </div>

      <div className="animate-in delay-1">
        <AdminClient
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
          products={products.map((product) => ({ id: product.id, name: product.name }))}
        />
      </div>
    </div>
  );
}
