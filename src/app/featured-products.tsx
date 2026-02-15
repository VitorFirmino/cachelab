import { getFeaturedProducts } from "@/service/data";

import { FeaturedGrid } from "./home-client";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(6);

  return <FeaturedGrid initialFeatured={{ products: JSON.parse(JSON.stringify(products)) }} />;
}
