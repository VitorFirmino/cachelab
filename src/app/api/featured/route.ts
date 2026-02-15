import { NextResponse } from "next/server";

import { getFeaturedProducts } from "@/service/data";

export async function GET() {
  const products = await getFeaturedProducts(6);
  const generatedAt = new Date().toISOString();

  return NextResponse.json(
    {
      generatedAt,
      data: {
        products,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
