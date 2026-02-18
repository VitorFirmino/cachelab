import { notFound } from "next/navigation";

import { getProductById, getProductEvents } from "@/service/data";

import { ProductDetailClient } from "./product-detail-client";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ checkout?: string; _r?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const requestNonce = resolvedSearchParams?.checkout?.trim() || resolvedSearchParams?._r?.trim();
  const productId = Number(id);

  const [product, events] = await Promise.all([
    getProductById(productId, requestNonce),
    getProductEvents(productId, 5, requestNonce),
  ]);

  if (!product) {
    notFound();
  }

  const initialData = JSON.parse(JSON.stringify({ product, events }));

  return (
    <ProductDetailClient
      productId={productId}
      initialData={initialData}
      requestNonce={requestNonce}
    />
  );
}
