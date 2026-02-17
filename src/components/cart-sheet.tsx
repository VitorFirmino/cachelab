"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cacheClear } from "@/service/api-cache";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/empty-state";
import { useCartStore, subtotal, totalItems } from "@/store/cart-store";
import { processCheckout } from "@/app/actions/checkout";
import type { OrderSummary } from "@/lib/types";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const router = useRouter();
  const items = useCartStore((store) => store.items);
  const removeItem = useCartStore((store) => store.removeItem);
  const updateQuantity = useCartStore((store) => store.updateQuantity);
  const syncItemStock = useCartStore((store) => store.syncItemStock);
  const clearCart = useCartStore((store) => store.clearCart);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderSummary | null>(null);
  const checkoutLockRef = useRef(false);

  const count = totalItems(items);
  const total = subtotal(items);

  async function handleCheckout() {
    if (checkoutLockRef.current) return;
    checkoutLockRef.current = true;
    setIsCheckingOut(true);
    try {
      const checkoutItems = useCartStore
        .getState()
        .items.map((cartItem) => ({ productId: cartItem.productId, quantity: cartItem.quantity }));
      const result = await processCheckout(
        checkoutItems,
      );
      if (result.ok) {
        setOrderResult(result.orderSummary);
        clearCart();
        cacheClear();
      } else {
        if (result.code === "INSUFFICIENT_STOCK") {
          syncItemStock(result.productId, result.available);
        }
        toast.error(result.message);
      }
    } catch {
      toast.error("Erro ao processar compra.");
    } finally {
      setIsCheckingOut(false);
      checkoutLockRef.current = false;
    }
  }

  function handleClose() {
    const shouldRedirectToCatalog = !!orderResult;
    setOrderResult(null);
    onOpenChange(false);
    if (shouldRedirectToCatalog) {
      router.push("/products");
      router.refresh();
    }
  }

  if (orderResult) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Compra Realizada</SheetTitle>
            <SheetDescription>Seu pedido foi processado com sucesso</SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <div className="rounded-full bg-success/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>

            <div className="w-full space-y-2">
              {orderResult.items.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono">R$ {item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="text-accent-cyan">R$ {orderResult.total.toFixed(2)}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleClose}>
              Voltar às compras
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Carrinho {count > 0 && `(${count})`}</SheetTitle>
          <SheetDescription>
            {count > 0 ? `${count} ${count === 1 ? "item" : "itens"} no carrinho` : "Seu carrinho está vazio"}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon={<ShoppingCart />}
              title="Carrinho vazio"
              description="Adicione produtos para começar"
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-xl border border-border bg-[rgba(17,27,46,0.3)] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                      {item.categoryName && (
                        <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 -m-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0 cursor-pointer"
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[rgba(79,125,255,0.3)] transition-all cursor-pointer"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[rgba(79,125,255,0.3)] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-accent-cyan font-mono">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold text-accent-cyan">
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? "Processando..." : "Finalizar Compra"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
