import { NextResponse } from "next/server";

import { getCategories } from "@/service/data";

export async function GET() {
  const categories = await getCategories();
  const generatedAt = new Date().toISOString();

  return NextResponse.json(
    {
      generatedAt,
      data: categories,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
