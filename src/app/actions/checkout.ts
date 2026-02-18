"use server";

import { revalidatePath, updateTag } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { OrderSummary } from "@/lib/types";

interface CheckoutItem {
  productId: number;
  quantity: number;
}

type InsufficientStockError = Error & {
  code: "INSUFFICIENT_STOCK";
  productId: number;
  available: number;
  requested: number;
};

type ProductNotFoundError = Error & {
  code: "PRODUCT_NOT_FOUND";
  productId: number;
};

const createInsufficientStockError = (
  productId: number,
  productName: string,
  available: number,
  requested: number,
): InsufficientStockError =>
  Object.assign(
    new Error(
      `Estoque insuficiente para "${productName}". Disponível: ${available}, solicitado: ${requested}.`,
    ),
    { code: "INSUFFICIENT_STOCK" as const, productId, available, requested },
  );

const createProductNotFoundError = (productId: number): ProductNotFoundError =>
  Object.assign(
    new Error(`O produto #${productId} não existe mais.`),
    { code: "PRODUCT_NOT_FOUND" as const, productId },
  );

export async function processCheckout(items: CheckoutItem[]) {
  try {
    if (!items.length) {
      return { ok: false as const, message: "Carrinho vazio." };
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 500),
    );

    const orderItems: OrderSummary["items"] = [];

    const runTransaction = () =>
      prisma.$transaction(
        async (tx) => {
          for (const item of items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { id: true, name: true, price: true },
            });
            if (!product) {
              throw createProductNotFoundError(item.productId);
            }

            const updated = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });

            if (updated.count === 0) {
              const latest = await tx.product.findUnique({
                where: { id: item.productId },
                select: { stock: true, name: true },
              });

              if (!latest) {
                throw createProductNotFoundError(item.productId);
              }

              throw createInsufficientStockError(
                item.productId,
                latest.name,
                latest.stock,
                item.quantity,
              );
            }

            await tx.event.create({
              data: {
                type: "sale",
                message: `Venda de ${item.quantity}x "${product.name}" — R$ ${(product.price * item.quantity).toFixed(2)}`,
                productId: item.productId,
              },
            });

            orderItems.push({
              name: product.name,
              quantity: item.quantity,
              total: product.price * item.quantity,
            });
          }
        },
        {
          maxWait: 15_000,
          timeout: 20_000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

    try {
      await runTransaction();
    } catch (error) {
      const isTimeout =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2028";
      if (!isTimeout) throw error;
      orderItems.length = 0;
      await new Promise((r) => setTimeout(r, 250));
      await runTransaction();
    }

    const orderSummary: OrderSummary = {
      items: orderItems,
      total: orderItems.reduce((sum, i) => sum + i.total, 0),
    };

    for (const tag of ["featured", "products", "events"]) updateTag(tag);
    for (const path of ["/", "/products"]) revalidatePath(path, "layout");
    for (const { productId } of items) {
      updateTag(`product:${productId}`);
      revalidatePath(`/product/${productId}`, "layout");
    }

    return {
      ok: true as const,
      message: "Compra realizada com sucesso!",
      orderSummary,
    };
  } catch (error) {
    console.error("[checkout]", error);
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "INSUFFICIENT_STOCK"
    ) {
      const stockError = error as InsufficientStockError;
      return {
        ok: false as const,
        code: "INSUFFICIENT_STOCK" as const,
        message: stockError.message,
        productId: stockError.productId,
        available: stockError.available,
        requested: stockError.requested,
      };
    }
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "PRODUCT_NOT_FOUND"
    ) {
      const missingError = error as ProductNotFoundError;
      return {
        ok: false as const,
        code: "PRODUCT_NOT_FOUND" as const,
        message: missingError.message,
        productId: missingError.productId,
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        ok: false as const,
        code: "PRODUCT_NOT_FOUND" as const,
        message: "Um dos produtos do carrinho não existe mais.",
      };
    }
    return {
      ok: false as const,
      message: "Falha ao processar compra. Tente novamente.",
    };
  }
}
