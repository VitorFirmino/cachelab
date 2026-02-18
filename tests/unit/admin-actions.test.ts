import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockUpdateTag = vi.fn();
const mockSetCacheTTLOverride = vi.fn();

const mockPrisma = {
  product: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  event: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  cacheConfig: {
    upsert: vi.fn(),
  },
};

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
  updateTag: mockUpdateTag,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/cache-config", () => ({
  setCacheTTLOverride: mockSetCacheTTLOverride,
}));

async function loadActions() {
  return import("@/app/admin/actions");
}

function createProductFormData(overrides?: Partial<{ name: string; price: string; stock: string; categoryId: string }>) {
  const formData = new FormData();
  formData.set("name", overrides?.name ?? "Keyboard");
  formData.set("price", overrides?.price ?? "120");
  formData.set("stock", overrides?.stock ?? "10");
  formData.set("categoryId", overrides?.categoryId ?? "2");
  return formData;
}

describe("admin actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CACHELAB_DISABLE_DB;
  });

  it("creates product and triggers cache invalidation", async () => {
    const { createProduct } = await loadActions();
    mockPrisma.product.create.mockResolvedValueOnce({ id: 9, name: "Keyboard" });

    const result = await createProduct(createProductFormData());

    expect(result).toEqual({
      ok: true,
      message: "Produto Keyboard criado.",
      id: 9,
    });
    expect(mockPrisma.product.create).toHaveBeenCalledWith({
      data: {
        name: "Keyboard",
        price: 120,
        stock: 10,
        categoryId: 2,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "page");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/products", "page");
    expect(mockUpdateTag).toHaveBeenCalledWith("featured");
    expect(mockUpdateTag).toHaveBeenCalledWith("products");
    expect(mockUpdateTag).toHaveBeenCalledWith("product:9");
  });

  it("returns validation error when create payload is invalid", async () => {
    const { createProduct } = await loadActions();

    const result = await createProduct(createProductFormData({ name: "", price: "NaN" }));

    expect(result).toEqual({ ok: false, message: "Campos obrigatórios ausentes." });
    expect(mockPrisma.product.create).not.toHaveBeenCalled();
  });

  it("updates product and invalidates detail/list/home tags", async () => {
    const { updateProduct } = await loadActions();
    const formData = new FormData();
    formData.set("id", "9");
    formData.set("price", "150");
    formData.set("stock", "11");
    mockPrisma.product.update.mockResolvedValueOnce({ id: 9, name: "Keyboard Pro" });

    const result = await updateProduct(formData);

    expect(result).toEqual({ ok: true, message: "Produto Keyboard Pro atualizado." });
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { price: 150, stock: 11 },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/product/9", "page");
    expect(mockUpdateTag).toHaveBeenCalledWith("product:9");
  });

  it("deletes product and returns success message", async () => {
    const { deleteProduct } = await loadActions();
    mockPrisma.event.deleteMany.mockResolvedValueOnce({ count: 2 });
    mockPrisma.product.delete.mockResolvedValueOnce({ id: 4, name: "Mouse" });

    const result = await deleteProduct(4);

    expect(result).toEqual({ ok: true, message: 'Produto "Mouse" apagado.' });
    expect(mockPrisma.event.deleteMany).toHaveBeenCalledWith({ where: { productId: 4 } });
    expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/product/4", "page");
    expect(mockUpdateTag).toHaveBeenCalledWith("events");
    expect(mockUpdateTag).toHaveBeenCalledWith("product:4");
  });

  it("updates cache TTL in local mode without touching database", async () => {
    process.env.CACHELAB_DISABLE_DB = "1";
    const { updateCacheTTL } = await loadActions();

    const result = await updateCacheTTL("products", 10, 20, 30);

    expect(result).toEqual({
      ok: true,
      message: 'TTL "products" atualizado (sem DB).',
    });
    expect(mockSetCacheTTLOverride).toHaveBeenCalledWith("products", {
      stale: 10,
      revalidate: 20,
      expire: 30,
    });
    expect(mockPrisma.cacheConfig.upsert).not.toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith("products", "max");
  });

  it("validates cache TTL profile and ordering", async () => {
    const { updateCacheTTL } = await loadActions();

    await expect(updateCacheTTL("invalid", 1, 2, 3)).resolves.toEqual({
      ok: false,
      message: "Perfil inválido.",
    });
    await expect(updateCacheTTL("products", -1, 2, 3)).resolves.toEqual({
      ok: false,
      message: "Valores devem ser >= 0.",
    });
    await expect(updateCacheTTL("products", 50, 20, 30)).resolves.toEqual({
      ok: false,
      message: "Deve respeitar: stale ≤ revalidate ≤ expire.",
    });
  });

  it("purges all cache tags and layout paths", async () => {
    const { purgeAllCache, purgeCacheByTags } = await loadActions();

    const resultAll = await purgeAllCache();
    const resultTags = await purgeCacheByTags(["products", "featured"]);

    expect(resultAll).toEqual({ ok: true, message: "Todo o cache foi limpo." });
    expect(resultTags).toEqual({
      ok: true,
      message: "Cache limpo para: products, featured",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/products", "layout");
    expect(mockRevalidateTag).toHaveBeenCalledWith("products", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("featured", "max");
  });
});
