import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type CatalogOperation =
  | { op: "featured"; limit?: number }
  | { op: "productsPage"; page: number; pageSize: number; categoryId?: number; query?: string }
  | { op: "productById"; id: number }
  | { op: "productEvents"; productId: number; limit?: number }
  | { op: "categories" };

type ProductRow = {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number | null;
  updatedAt: string;
};

type CategoryRow = {
  id: number;
  name: string;
};

function parseLimit(value: unknown, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(Math.floor(parsed), max));
}

async function withCategories(
  supabase: ReturnType<typeof createClient>,
  products: ProductRow[],
) {
  const categoryIds = Array.from(
    new Set(products.map((product) => product.categoryId).filter((id): id is number => id !== null)),
  );

  if (categoryIds.length === 0) {
    return products.map((product) => ({ ...product, category: null }));
  }

  const categoryRes = await supabase
    .from("Category")
    .select("id,name")
    .in("id", categoryIds);

  if (categoryRes.error) {
    throw new Error(`Failed to load categories: ${categoryRes.error.message}`);
  }

  const categories = (categoryRes.data ?? []) as CategoryRow[];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return products.map((product) => ({
    ...product,
    category: product.categoryId ? categoryMap.get(product.categoryId) ?? null : null,
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json().catch(() => ({}))) as Partial<CatalogOperation>;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    if (payload.op === "featured") {
      const limit = parseLimit(payload.limit, 6, 20);
      const productsRes = await supabase
        .from("Product")
        .select("id,name,price,stock,categoryId,updatedAt")
        .order("updatedAt", { ascending: false })
        .limit(limit);

      if (productsRes.error) {
        throw new Error(`Failed to load featured products: ${productsRes.error.message}`);
      }

      const products = await withCategories(supabase, (productsRes.data ?? []) as ProductRow[]);
      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.op === "productsPage") {
      const page = parseLimit(payload.page, 1, 10_000);
      const pageSize = parseLimit(payload.pageSize, 10, 100);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const query = payload.query?.trim();

      let itemsQuery = supabase
        .from("Product")
        .select("id,name,price,stock,categoryId,updatedAt")
        .order("updatedAt", { ascending: false })
        .range(from, to);

      let countQuery = supabase
        .from("Product")
        .select("id", { head: true, count: "exact" });

      if (payload.categoryId) {
        itemsQuery = itemsQuery.eq("categoryId", payload.categoryId);
        countQuery = countQuery.eq("categoryId", payload.categoryId);
      }

      if (query) {
        itemsQuery = itemsQuery.ilike("name", `%${query}%`);
        countQuery = countQuery.ilike("name", `%${query}%`);
      }

      const [itemsRes, countRes] = await Promise.all([itemsQuery, countQuery]);

      if (itemsRes.error) {
        throw new Error(`Failed to load products page: ${itemsRes.error.message}`);
      }
      if (countRes.error) {
        throw new Error(`Failed to count products: ${countRes.error.message}`);
      }

      const items = await withCategories(supabase, (itemsRes.data ?? []) as ProductRow[]);
      return new Response(
        JSON.stringify({ items, total: countRes.count ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (payload.op === "productById") {
      const id = Number(payload.id);
      if (!Number.isFinite(id)) {
        return new Response(JSON.stringify({ product: null }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productRes = await supabase
        .from("Product")
        .select("id,name,price,stock,categoryId,updatedAt")
        .eq("id", id)
        .maybeSingle();

      if (productRes.error) {
        throw new Error(`Failed to load product: ${productRes.error.message}`);
      }
      if (!productRes.data) {
        return new Response(JSON.stringify({ product: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [product] = await withCategories(supabase, [productRes.data as ProductRow]);
      return new Response(JSON.stringify({ product }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.op === "productEvents") {
      const productId = Number(payload.productId);
      if (!Number.isFinite(productId)) {
        return new Response(JSON.stringify({ events: [] }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const limit = parseLimit(payload.limit, 5, 50);

      const eventsRes = await supabase
        .from("Event")
        .select("id,type,message,productId,createdAt")
        .eq("productId", productId)
        .order("createdAt", { ascending: false })
        .limit(limit);

      if (eventsRes.error) {
        throw new Error(`Failed to load product events: ${eventsRes.error.message}`);
      }

      return new Response(JSON.stringify({ events: eventsRes.data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.op === "categories") {
      const categoriesRes = await supabase
        .from("Category")
        .select("id,name")
        .order("name", { ascending: true });

      if (categoriesRes.error) {
        throw new Error(`Failed to load categories: ${categoriesRes.error.message}`);
      }

      return new Response(JSON.stringify({ categories: categoriesRes.data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unsupported operation." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Catalog edge function failure.",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
