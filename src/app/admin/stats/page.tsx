import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { CacheControls } from "./cache-controls";
import { EventsLog } from "./events-log";
import { getAllCacheConfigs } from "@/lib/cache-config";
import { prisma } from "@/lib/prisma";

export default async function AdminStatsPage() {
  await connection();
  const disableDb = process.env.CACHELAB_DISABLE_DB === "1";
  const uptimeSeconds = Math.round(process.uptime());
  const uptimeFormatted = uptimeSeconds > 3600
    ? `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
    : uptimeSeconds > 60
      ? `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`
      : `${uptimeSeconds}s`;

  // eslint-disable-next-line react-hooks/purity -- Server-rendered admin page; request-time cutoff is intentional.
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [productCount, eventCount, cacheConfigs] = await Promise.all([
    disableDb ? Promise.resolve(0) : prisma.product.count().catch(() => 0),
    disableDb
      ? Promise.resolve(0)
      : prisma.event.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }).catch(() => 0),
    getAllCacheConfigs(),
  ]);

  const serializedConfigs = cacheConfigs.map((c) => ({
    id: c.id,
    label: c.label,
    stale: c.stale,
    revalidate: c.revalidate,
    expire: c.expire,
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="animate-in">
        <div className="section-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold gradient-text">Estatísticas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dados atualizados a cada requisição — somente admin
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:border-[rgba(79,125,255,0.3)] hover:bg-[rgba(79,125,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(79,125,255,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 animate-in delay-1">
        <div className="stat-card rounded-2xl border border-border bg-card p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(79,125,255,0.25)]">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Total de Produtos</div>
          <div className="stat-value">
            <div className="text-3xl font-extrabold text-accent-cyan neon-text-cyan">{productCount}</div>
          </div>
        </div>

        <div className="stat-card rounded-2xl border border-border bg-card p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(79,125,255,0.25)]">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Eventos (24h)</div>
          <div className="stat-value">
            <div className="text-3xl font-extrabold text-accent-cyan neon-text-cyan">{eventCount}</div>
          </div>
        </div>

        <div className="stat-card rounded-2xl border border-border bg-card p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(79,125,255,0.25)]">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Uptime do Processo</div>
          <div className="stat-value">
            <div className="text-3xl font-extrabold text-accent-cyan neon-text-cyan">{uptimeFormatted}</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">{uptimeSeconds} segundos</div>
          </div>
        </div>
      </div>

      <div className="animate-in delay-2">
        <CacheControls initialConfigs={serializedConfigs} />
      </div>

      <div className="animate-in delay-3">
        <EventsLog />
      </div>
    </div>
  );
}
