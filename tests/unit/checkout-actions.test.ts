import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class PrismaClientKnownRequestError extends Error {
  code: string;

  constructor(message: string, { code }: { code: string }) {
    super(message);
    this.code = code;
  }
}

const mockRevalidatePath = vi.fn();
const mockUpdateTag = vi.fn();
const mockTransaction = vi.fn();

const mockTx = {
  product: {
    findUniqueOrThrow: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  event: {
    create: vi.fn(),
  },
};

const mockPrisma = {
  $transaction: mockTransaction,
};

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  updateTag: mockUpdateTag,
}));

vi.mock("@prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError,
    TransactionIsolationLevel: {
      ReadCommitted: "ReadCommitted",
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

async function loadCheckoutActions() {
  return import("@/app/actions/checkout");
}

describe("processCheckout", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns early when cart is empty", async () => {
    const { processCheckout } = await loadCheckoutActions();
    const result = await processCheckout([]);

    expect(result).toEqual({
      ok: false,
      message: "Carrinho vazio.",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("processes checkout successfully and updates cache tags", async () => {
    const { processCheckout } = await loadCheckoutActions();
    mockTx.product.findUniqueOrThrow.mockResolvedValueOnce({
      id: 1,
      name: "Mouse",
      price: 100,
    });
    mockTx.product.updateMany.mockResolvedValueOnce({ count: 1 });
    mockTx.event.create.mockResolvedValueOnce({});
    mockTransaction.mockImplementationOnce(async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx));

    const promise = processCheckout([{ productId: 1, quantity: 2 }]);
    await vi.advanceTimersByTimeAsync(1_000);
    const result = await promise;

    expect(result).toEqual({
      ok: true,
      message: "Compra realizada com sucesso!",
      orderSummary: {
        items: [{ name: "Mouse", quantity: 2, total: 200 }],
        total: 200,
      },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockUpdateTag).toHaveBeenCalledWith("featured");
    expect(mockUpdateTag).toHaveBeenCalledWith("products");
    expect(mockUpdateTag).toHaveBeenCalledWith("events");
    expect(mockUpdateTag).toHaveBeenCalledWith("product:1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/products", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/product/1", "layout");
  });

  it("returns INSUFFICIENT_STOCK error details", async () => {
    const { processCheckout } = await loadCheckoutActions();
    mockTx.product.findUniqueOrThrow.mockResolvedValueOnce({
      id: 5,
      name: "Keyboard",
      price: 200,
    });
    mockTx.product.updateMany.mockResolvedValueOnce({ count: 0 });
    mockTx.product.findUnique.mockResolvedValueOnce({
      stock: 1,
      name: "Keyboard",
    });
    mockTransaction.mockImplementationOnce(async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx));

    const promise = processCheckout([{ productId: 5, quantity: 3 }]);
    await vi.advanceTimersByTimeAsync(1_000);
    const result = await promise;

    expect(result).toEqual({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      message: 'Estoque insuficiente para "Keyboard". Disponível: 1, solicitado: 3.',
      productId: 5,
      available: 1,
      requested: 3,
    });
  });

  it("retries transaction once when first attempt fails with P2028 timeout", async () => {
    const { processCheckout } = await loadCheckoutActions();
    const timeoutError = new PrismaClientKnownRequestError("timeout", {
      code: "P2028",
    });
    mockTx.product.findUniqueOrThrow.mockResolvedValueOnce({
      id: 2,
      name: "Headset",
      price: 50,
    });
    mockTx.product.updateMany.mockResolvedValueOnce({ count: 1 });
    mockTx.event.create.mockResolvedValueOnce({});

    mockTransaction
      .mockRejectedValueOnce(timeoutError)
      .mockImplementationOnce(async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx));

    const promise = processCheckout([{ productId: 2, quantity: 1 }]);
    await vi.advanceTimersByTimeAsync(2_000);
    const result = await promise;

    expect(result).toEqual({
      ok: true,
      message: "Compra realizada com sucesso!",
      orderSummary: {
        items: [{ name: "Headset", quantity: 1, total: 50 }],
        total: 50,
      },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(2);
  });

  it("returns generic error on unknown transaction failures", async () => {
    const { processCheckout } = await loadCheckoutActions();
    mockTransaction.mockRejectedValueOnce(new Error("db down"));

    const promise = processCheckout([{ productId: 1, quantity: 1 }]);
    await vi.advanceTimersByTimeAsync(1_000);
    const result = await promise;

    expect(result).toEqual({
      ok: false,
      message: "Falha ao processar compra. Tente novamente.",
    });
  });
});
