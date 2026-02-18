import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = {
  cacheConfig: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

async function loadCacheConfig() {
  return import("@/lib/cache-config");
}

describe("cache-config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CACHELAB_DISABLE_DB;
  });

  it("returns default ttl when db is disabled", async () => {
    process.env.CACHELAB_DISABLE_DB = "1";
    const { getCacheTTL } = await loadCacheConfig();

    await expect(getCacheTTL("products")).resolves.toEqual({
      stale: 60,
      revalidate: 120,
      expire: 1800,
    });
    expect(mockPrisma.cacheConfig.findUnique).not.toHaveBeenCalled();
  });

  it("returns ttl from db when available", async () => {
    const { getCacheTTL } = await loadCacheConfig();
    mockPrisma.cacheConfig.findUnique.mockResolvedValueOnce({
      id: "products",
      stale: 11,
      revalidate: 22,
      expire: 33,
    });

    await expect(getCacheTTL("products")).resolves.toEqual({
      stale: 11,
      revalidate: 22,
      expire: 33,
    });
  });

  it("uses override values before db lookup", async () => {
    const { getCacheTTL, setCacheTTLOverride } = await loadCacheConfig();
    setCacheTTLOverride("product", { stale: 1, revalidate: 2, expire: 3 });

    await expect(getCacheTTL("product")).resolves.toEqual({
      stale: 1,
      revalidate: 2,
      expire: 3,
    });
    expect(mockPrisma.cacheConfig.findUnique).not.toHaveBeenCalled();
  });

  it("returns defaults when db lookup fails", async () => {
    const { getCacheTTL } = await loadCacheConfig();
    mockPrisma.cacheConfig.findUnique.mockRejectedValueOnce(new Error("db down"));

    await expect(getCacheTTL("featured")).resolves.toEqual({
      stale: 120,
      revalidate: 180,
      expire: 3600,
    });
  });

  it("returns merged configs from db with defaults for missing profiles", async () => {
    const { getAllCacheConfigs } = await loadCacheConfig();
    mockPrisma.cacheConfig.findMany.mockResolvedValueOnce([
      {
        id: "products",
        label: "Lista de Produtos",
        stale: 9,
        revalidate: 19,
        expire: 29,
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const configs = await getAllCacheConfigs();
    const products = configs.find((c) => c.id === "products");
    const featured = configs.find((c) => c.id === "featured");

    expect(products).toMatchObject({
      id: "products",
      stale: 9,
      revalidate: 19,
      expire: 29,
    });
    expect(featured).toMatchObject({
      id: "featured",
      stale: 120,
      revalidate: 180,
      expire: 3600,
    });
  });
});
