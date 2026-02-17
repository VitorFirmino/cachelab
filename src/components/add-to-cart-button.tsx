"use client";

import type { MouseEvent } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/lib/types";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((store) => store.addItem);
  const cartItems = useCartStore((store) => store.items);

  const cartItem = cartItems.find((cartItemEntry) => cartItemEntry.productId === product.id);
  const inCart = cartItem?.quantity ?? 0;
  const remainingStock = product.stock - inCart;
  const isOutOfStock = product.stock === 0;
  const isAtLimit = remainingStock <= 0;

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || isAtLimit) return;

    const added = addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      maxStock: product.stock,
      categoryName: product.category?.name ?? null,
    });
    if (added) {
      toast.success(`"${product.name}" adicionado ao carrinho`);
    }
  }

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/30 py-2 text-xs font-medium text-muted-foreground opacity-60 cursor-not-allowed"
      >
        Esgotado
      </button>
    );
  }

  if (isAtLimit) {
    return (
      <button
        type="button"
        disabled
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/30 py-2 text-xs font-medium text-muted-foreground opacity-60 cursor-not-allowed"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Limite atingido ({inCart}/{product.stock})
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgba(79,125,255,0.3)] bg-[rgba(79,125,255,0.08)] py-2 text-xs font-medium text-primary transition-all hover:bg-[rgba(79,125,255,0.18)] hover:border-[rgba(79,125,255,0.5)] hover:shadow-[0_0_12px_rgba(79,125,255,0.15)] active:scale-[0.97] cursor-pointer"
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      {inCart > 0 ? `Comprar mais (${inCart} no carrinho)` : "Comprar"}
    </button>
  );
}
