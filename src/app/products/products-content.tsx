import { getCategories, getProductsPage } from "@/service/data";

import { ProductsClient } from "./products-client";

interface ProductsContentProps {
  searchParams: Promise<{ page?: string; category?: string; query?: string; q?: string; checkout?: string; _r?: string }>;
}

const PRODUCTS_PAGE_SIZE = 6;

export async function ProductsContent({ searchParams }: ProductsContentProps) {
  const resolvedParams = await searchParams;

  const parseNumberParam = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const page = parseNumberParam(resolvedParams?.page, 1);
  const category = resolvedParams?.category
    ? parseNumberParam(resolvedParams.category, NaN)
    : NaN;
  const categoryId = Number.isFinite(category) ? category : undefined;
  const query = resolvedParams?.query?.trim() || resolvedParams?.q?.trim() || "";
  const checkoutNonce = resolvedParams?.checkout?.trim() || resolvedParams?._r?.trim();
  const pageSize = PRODUCTS_PAGE_SIZE;

  const [productsResult, categories] = await Promise.all([
    getProductsPage({ page, pageSize, categoryId, query, cacheBust: checkoutNonce }),
    getCategories(),
  ]);

  const initialProducts = JSON.parse(JSON.stringify({
    items: productsResult.items,
    total: productsResult.total,
    page,
    pageSize,
  }));

  const initialCategories = JSON.parse(JSON.stringify(categories));
  const clientKey = `${page}:${categoryId ?? "all"}:${query}:${checkoutNonce ?? ""}`;

  return (
    <ProductsClient
      key={clientKey}
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      page={page}
      pageSize={pageSize}
      categoryId={categoryId}
      query={query}
      requestNonce={checkoutNonce}
    />
  );
}
