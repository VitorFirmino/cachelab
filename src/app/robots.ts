import { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: isProduction
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/login", "/logout", "/api/", "/stats"],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
