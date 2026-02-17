"use server";

import { refresh, revalidatePath, revalidateTag, updateTag } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { setCacheTTLOverride, type CacheProfile } from "@/lib/cache-config";

export async function createProduct(formData: FormData) {
  try {
    const name = String(formData.get("name") || "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const categoryIdRaw = formData.get("categoryId");
    const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;

    if (!name || Number.isNaN(price) || Number.isNaN(stock)) {
      return { ok: false, message: "Campos obrigatórios ausentes." };
    }

    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        categoryId: Number.isNaN(categoryId) ? undefined : categoryId,
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    updateTag("featured");
    updateTag("products");
    updateTag(`product:${product.id}`);

    return {
      ok: true,
      message: `Produto ${product.name} criado.`,
      id: product.id,
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Falha ao criar produto." };
  }
}

export async function updateProduct(formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));

    if (Number.isNaN(id) || Number.isNaN(price) || Number.isNaN(stock)) {
      return { ok: false, message: "Campos inválidos." };
    }

    const product = await prisma.product.update({
      where: { id },
      data: { price, stock },
    });

    revalidatePath("/");
    revalidatePath("/products");
    updateTag("featured");
    updateTag("products");
    updateTag(`product:${product.id}`);

    return { ok: true, message: `Produto ${product.name} atualizado.` };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Falha ao atualizar produto." };
  }
}

export async function createEvent(formData: FormData) {
  try {
    const type = String(formData.get("type") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const productIdRaw = formData.get("productId");
    const productId = productIdRaw ? Number(productIdRaw) : undefined;

    if (!type || !message) {
      return { ok: false, message: "Tipo e mensagem são obrigatórios." };
    }

    const event = await prisma.event.create({
      data: {
        type,
        message,
        productId: Number.isNaN(productId) ? undefined : productId,
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    updateTag("pulse");
    updateTag("products");
    updateTag("events");
    if (event.productId) {
      updateTag(`product:${event.productId}`);
      revalidatePath(`/product/${event.productId}`);
    }

    return { ok: true, message: "Evento criado." };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Falha ao criar evento." };
  }
}

export async function deleteProduct(productId: number) {
  try {
    if (Number.isNaN(productId)) {
      return { ok: false, message: "ID do produto inválido." };
    }

    await prisma.event.deleteMany({ where: { productId } });
    const product = await prisma.product.delete({ where: { id: productId } });

    revalidatePath("/");
    revalidatePath("/products");
    updateTag("featured");
    updateTag("products");
    updateTag("events");
    updateTag(`product:${productId}`);
    refresh();

    return { ok: true, message: `Produto "${product.name}" apagado.` };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Falha ao apagar produto." };
  }
}

export async function purgeAllCache() {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    revalidateTag("featured", "max");
    revalidateTag("products", "max");
    revalidateTag("events", "max");
    revalidateTag("categories", "max");
    revalidateTag("pulse", "max");

    return { ok: true, message: "Todo o cache foi limpo." };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Falha ao limpar cache." };
  }
}

const VALID_PROFILES = [
  "featured",
  "products",
  "product",
  "events",
  "categories",
] as const;
const PROFILE_LABELS: Record<(typeof VALID_PROFILES)[number], string> = {
  featured: "Destaques (Home)",
  products: "Lista de Produtos",
  product: "Detalhe do Produto",
  events: "Eventos",
  categories: "Categorias",
};

export async function updateCacheTTL(
  profile: string,
  stale: number,
  revalidate: number,
  expire: number,
) {
  try {
    if (!VALID_PROFILES.includes(profile as (typeof VALID_PROFILES)[number])) {
      return { ok: false, message: "Perfil inválido." };
    }
    const profileId = profile as (typeof VALID_PROFILES)[number];
    if (stale < 0 || revalidate < 0 || expire < 0) {
      return { ok: false, message: "Valores devem ser >= 0." };
    }
    if (stale > revalidate || revalidate > expire) {
      return {
        ok: false,
        message: "Deve respeitar: stale ≤ revalidate ≤ expire.",
      };
    }

    // Local/test mode without DB: keep TTLs in memory so the UI still works (and reload persists while server stays up).
    if (process.env.CACHELAB_DISABLE_DB === "1") {
      setCacheTTLOverride(profileId as CacheProfile, {
        stale,
        revalidate,
        expire,
      });
      revalidateTag(profileId, "max");
      revalidatePath("/");
      revalidatePath("/products");
      return { ok: true, message: `TTL "${profileId}" atualizado (sem DB).` };
    }

    await prisma.cacheConfig.upsert({
      where: { id: profileId },
      update: { stale, revalidate, expire },
      create: {
        id: profileId,
        label: PROFILE_LABELS[profileId],
        stale,
        revalidate,
        expire,
      },
    });

    revalidateTag(profileId, "max");
    revalidatePath("/");
    revalidatePath("/products");

    return { ok: true, message: `TTL "${profileId}" atualizado.` };
  } catch (error) {
    // Most common local/prod misconfig: schema not applied yet.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      return {
        ok: false,
        message: "Tabela CacheConfig nao existe no banco.",
      };
    }

    console.error(error);
    return {
      ok: false,
      message: "Falha ao atualizar TTL. Verifique logs do servidor.",
    };
  }
}

export async function purgeCacheByTags(tags: string[]) {
  try {
    for (const tag of tags) {
      revalidateTag(tag, "max");
    }
    revalidatePath("/");
    revalidatePath("/products");

    return { ok: true, message: `Cache limpo para: ${tags.join(", ")}` };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Falha ao limpar cache por tags." };
  }
}
