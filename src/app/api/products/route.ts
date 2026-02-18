import { NextResponse } from "next/server";

import { getProductsPage, getProductById, getProductEvents } from "@/service/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const includeEvents = url.searchParams.get("includeEvents");

  const generatedAt = new Date().toISOString();

  if (id) {
    const productId = Number(id);
    const cacheBust = url.searchParams.get("_r") || undefined;
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }
    const product = await getProductById(productId, cacheBust);
    const events = includeEvents === "1" ? await getProductEvents(productId, 5, cacheBust) : [];

    return NextResponse.json(
      {
        generatedAt,
        data: {
          product,
          events,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }

  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 6);
  const categoryId = url.searchParams.get("categoryId");
  const query = url.searchParams.get("query")?.trim() || url.searchParams.get("q")?.trim() || undefined;
  const cacheBust = url.searchParams.get("_r") || undefined;

  const { items, total } = await getProductsPage({
    page,
    pageSize,
    categoryId: categoryId && !Number.isNaN(Number(categoryId)) ? Number(categoryId) : undefined,
    query,
    cacheBust,
  });

  return NextResponse.json(
    {
      generatedAt,
      data: {
        items,
        total,
        page,
        pageSize,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
