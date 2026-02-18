// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addItem: vi.fn(),
  toastSuccess: vi.fn(),
  storeState: {
    addItem: vi.fn(),
    items: [] as Array<{ productId: number; quantity: number }>,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
  },
}));

vi.mock("@/store/cart-store", () => ({
  useCartStore: (selector: (state: typeof mocks.storeState) => unknown) => selector(mocks.storeState),
}));

import { AddToCartButton } from "@/components/add-to-cart-button";

const product = {
  id: 10,
  name: "Mouse",
  price: 99.9,
  stock: 5,
  category: { id: 1, name: "Periféricos" },
} as never;

describe("AddToCartButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeState = {
      addItem: mocks.addItem,
      items: [],
    };
  });

  it("renders out-of-stock state", () => {
    render(<AddToCartButton product={{ ...product, stock: 0 }} />);
    expect(screen.getByRole("button", { name: "Esgotado" })).toBeDisabled();
  });

  it("renders at-limit state when cart already has maximum quantity", () => {
    mocks.storeState.items = [{ productId: 10, quantity: 5 }];
    render(<AddToCartButton product={product} />);
    expect(screen.getByText("Limite atingido (5/5)")).toBeInTheDocument();
  });

  it("adds item and emits success toast", () => {
    mocks.addItem.mockReturnValueOnce(true);
    render(<AddToCartButton product={product} />);

    fireEvent.click(screen.getByRole("button", { name: "Comprar" }));

    expect(mocks.addItem).toHaveBeenCalledWith({
      productId: 10,
      name: "Mouse",
      price: 99.9,
      maxStock: 5,
      categoryName: "Periféricos",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("\"Mouse\" adicionado ao carrinho");
  });
});
