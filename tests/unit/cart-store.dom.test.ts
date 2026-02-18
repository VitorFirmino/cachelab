// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadCartStore() {
  return import("@/store/cart-store");
}

describe("cart-store", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  it("adds items, caps quantity at stock, and returns boolean status", async () => {
    const { useCartStore } = await loadCartStore();
    const state = useCartStore.getState();

    const firstAdd = state.addItem({
      productId: 1,
      name: "Notebook",
      price: 1200,
      maxStock: 3,
      categoryName: "Electronics",
      quantity: 2,
    });
    const secondAdd = state.addItem({
      productId: 1,
      name: "Notebook",
      price: 1200,
      maxStock: 3,
      categoryName: "Electronics",
      quantity: 2,
    });
    const thirdAdd = state.addItem({
      productId: 1,
      name: "Notebook",
      price: 1200,
      maxStock: 3,
      categoryName: "Electronics",
      quantity: 1,
    });

    expect(firstAdd).toBe(true);
    expect(secondAdd).toBe(true);
    expect(thirdAdd).toBe(false);
    expect(useCartStore.getState().items).toEqual([
      {
        productId: 1,
        name: "Notebook",
        price: 1200,
        quantity: 3,
        maxStock: 3,
        categoryName: "Electronics",
      },
    ]);
  });

  it("updates quantities and removes item when quantity is zero", async () => {
    const { useCartStore } = await loadCartStore();
    const state = useCartStore.getState();
    state.addItem({
      productId: 2,
      name: "Headset",
      price: 200,
      maxStock: 5,
      categoryName: "Audio",
      quantity: 1,
    });

    state.updateQuantity(2, 4);
    expect(useCartStore.getState().items[0]?.quantity).toBe(4);

    state.updateQuantity(2, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("syncs stock and removes items that become unavailable", async () => {
    const { useCartStore } = await loadCartStore();
    const state = useCartStore.getState();
    state.addItem({
      productId: 3,
      name: "Mouse",
      price: 120,
      maxStock: 10,
      categoryName: "Accessories",
      quantity: 4,
    });

    state.syncItemStock(3, 2);
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);

    state.syncItemStock(3, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calculates total items and subtotal", async () => {
    const { subtotal, totalItems, useCartStore } = await loadCartStore();
    const state = useCartStore.getState();
    state.addItem({
      productId: 4,
      name: "Keyboard",
      price: 150,
      maxStock: 10,
      categoryName: "Accessories",
      quantity: 2,
    });
    state.addItem({
      productId: 5,
      name: "Monitor",
      price: 900,
      maxStock: 10,
      categoryName: "Displays",
      quantity: 1,
    });

    const items = useCartStore.getState().items;
    expect(totalItems(items)).toBe(3);
    expect(subtotal(items)).toBe(1200);
  });
});
