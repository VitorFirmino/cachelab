import { notFound } from "next/navigation";

import { getProductById, getProductEvents } from "@/service/data";

import { ProductDetailClient } from "./product-detail-client";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const productId = Number(id);

  const [product, events] = await Promise.all([
    getProductById(productId),
    getProductEvents(productId, 5),
  ]);

  if (!product) {
    notFound();
  }

  const initialData = JSON.parse(JSON.stringify({ product, events }));

  return (
    <ProductDetailClient
      productId={productId}
      initialData={initialData}
    />
  );
}
