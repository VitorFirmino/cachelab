import { cacheLife, cacheTag } from "next/cache";

import { getCacheTTL } from "@/lib/cache-config";
import { invokeSupabaseFunction } from "@/lib/supabase/functions";
import type { Category, Event, Product } from "@/lib/types";

type CatalogFeaturedResponse = { products: Product[] };
type CatalogProductsPageResponse = { items: Product[]; total: number };
type CatalogProductResponse = { product: Product | null };
type CatalogEventsResponse = { events: Event[] };
type CatalogCategoriesResponse = { categories: Category[] };

export async function getFeaturedProducts(limit = 6) {
  "use cache";
  cacheLife(await getCacheTTL("featured"));
  cacheTag("featured", "products");
  try {
    const result = await invokeSupabaseFunction<CatalogFeaturedResponse>("catalog", {
      op: "featured",
      limit,
    });
    return result.products;
  } catch {
    return [];
  }
}

export async function getProductsPage({
  page,
  pageSize,
  categoryId,
  query,
}: {
  page: number;
  pageSize: number;
  categoryId?: number;
  query?: string;
}) {
  "use cache";
  cacheLife(await getCacheTTL("products"));
  cacheTag("products");
  const search = query?.trim();
  try {
    return await invokeSupabaseFunction<CatalogProductsPageResponse>("catalog", {
      op: "productsPage",
      page,
      pageSize,
      categoryId,
      query: search,
    });
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getProductById(id: number) {
  "use cache";
  cacheLife(await getCacheTTL("product"));
  cacheTag("product", "products", `product:${id}`);
  try {
    const result = await invokeSupabaseFunction<CatalogProductResponse>("catalog", {
      op: "productById",
      id,
    });
    return result.product;
  } catch {
    return null;
  }
}

export async function getProductEvents(productId: number, limit = 5) {
  "use cache";
  cacheLife(await getCacheTTL("events"));
  cacheTag("events", `product:${productId}`);
  try {
    const result = await invokeSupabaseFunction<CatalogEventsResponse>("catalog", {
      op: "productEvents",
      productId,
      limit,
    });
    return result.events;
  } catch {
    return [];
  }
}

export async function getCategories() {
  "use cache";
  cacheLife(await getCacheTTL("categories"));
  cacheTag("categories");
  try {
    const result = await invokeSupabaseFunction<CatalogCategoriesResponse>("catalog", {
      op: "categories",
    });
    return result.categories;
  } catch {
    return [];
  }
}
