import { prisma } from "@/lib/prisma";

export const CACHE_PROFILES = ["featured", "products", "product", "events", "categories"] as const;
export type CacheProfile = (typeof CACHE_PROFILES)[number];

export interface CacheTTL {
  stale: number;
  revalidate: number;
  expire: number;
}

type CacheOverride = CacheTTL & { updatedAt: Date };
const OVERRIDES = new Map<CacheProfile, CacheOverride>();

const DEFAULT_META: Record<CacheProfile, CacheTTL & { label: string }> = {
  featured:   { label: "Destaques (Home)",   stale: 120, revalidate: 180, expire: 3600 },
  products:   { label: "Lista de Produtos",  stale: 60,  revalidate: 120, expire: 1800 },
  product:    { label: "Detalhe do Produto", stale: 120, revalidate: 300, expire: 3600 },
  events:     { label: "Eventos",            stale: 60,  revalidate: 300, expire: 3600 },
  categories: { label: "Categorias",         stale: 300, revalidate: 300, expire: 86400 },
};

export function setCacheTTLOverride(profile: CacheProfile, ttl: CacheTTL) {
  OVERRIDES.set(profile, { ...ttl, updatedAt: new Date() });
}

export async function getCacheTTL(profile: CacheProfile): Promise<CacheTTL> {
  const override = OVERRIDES.get(profile);
  if (override) {
    const { updatedAt: _updatedAt, ...ttl } = override;
    return ttl;
  }

  // During `next build` we don't want to depend on DB connectivity/migrations.
  if (process.env.CACHELAB_DISABLE_DB === "1") {
    const { label: _label, ...ttl } = DEFAULT_META[profile];
    return ttl;
  }

  try {
    const row = await prisma.cacheConfig.findUnique({ where: { id: profile } });
    if (row) {
      return { stale: row.stale, revalidate: row.revalidate, expire: row.expire };
    }
  } catch {
    // DB unavailable — fall back to defaults
  }
  const { label: _label, ...ttl } = DEFAULT_META[profile];
  return ttl;
}

export async function getAllCacheConfigs() {
  // During `next build` we don't want to depend on DB connectivity/migrations.
  if (process.env.CACHELAB_DISABLE_DB === "1") {
    const fallbackUpdatedAt = new Date(0);
    return CACHE_PROFILES.map((id) => {
      const override = OVERRIDES.get(id);
      const meta = DEFAULT_META[id];
      return {
        id,
        label: meta.label,
        stale: override?.stale ?? meta.stale,
        revalidate: override?.revalidate ?? meta.revalidate,
        expire: override?.expire ?? meta.expire,
        updatedAt: override?.updatedAt ?? fallbackUpdatedAt,
      };
    });
  }

  try {
    const rows = await prisma.cacheConfig.findMany({ orderBy: { id: "asc" } });
    const map = new Map<string, (typeof rows)[number]>();
    for (const row of rows) map.set(row.id, row);

    const fallbackUpdatedAt = new Date(0);
    return CACHE_PROFILES.map((id) => {
      const row = map.get(id);
      if (row) return row;
      const meta = DEFAULT_META[id];
      return {
        id,
        label: meta.label,
        stale: meta.stale,
        revalidate: meta.revalidate,
        expire: meta.expire,
        updatedAt: fallbackUpdatedAt,
      };
    });
  } catch {
    const fallbackUpdatedAt = new Date(0);
    return CACHE_PROFILES.map((id) => {
      const meta = DEFAULT_META[id];
      return {
        id,
        label: meta.label,
        stale: meta.stale,
        revalidate: meta.revalidate,
        expire: meta.expire,
        updatedAt: fallbackUpdatedAt,
      };
    });
  }
}
