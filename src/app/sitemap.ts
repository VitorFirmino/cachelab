import { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/url";
import { getProductsPage } from "@/service/data";

const PRODUCTS_PAGE_SIZE = 100;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const firstPage = await getProductsPage({ page: 1, pageSize: PRODUCTS_PAGE_SIZE });
    const totalPages = Math.max(1, Math.ceil(firstPage.total / PRODUCTS_PAGE_SIZE));

    const pages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        getProductsPage({ page: index + 2, pageSize: PRODUCTS_PAGE_SIZE }),
      ),
    );

    const allItems = [firstPage, ...pages].flatMap((page) => page.items);
    const productRoutes: MetadataRoute.Sitemap = allItems.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
