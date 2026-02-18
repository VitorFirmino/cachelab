import { getFeaturedProducts } from "@/service/data";

import { FeaturedGrid } from "./home-client";

interface FeaturedProductsProps {
  requestNonce?: string;
}

export async function FeaturedProducts({ requestNonce }: FeaturedProductsProps) {
  const products = await getFeaturedProducts(6, requestNonce);

  return (
    <FeaturedGrid
      initialFeatured={{ products: JSON.parse(JSON.stringify(products)) }}
      requestNonce={requestNonce}
    />
  );
}
