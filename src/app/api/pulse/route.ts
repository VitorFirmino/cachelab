import { NextResponse } from "next/server";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

import { createSupabaseFunctionsClient } from "@/lib/supabase/functions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 5);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 20)) : 5;

  const generatedAt = new Date().toISOString();
  const startedAt = performance.now();

  try {
    const supabase = createSupabaseFunctionsClient();
    const { data, error } = await supabase.functions.invoke("pulse", {
      body: { limit },
      headers: {
        "x-cachelab-source": "next-api-proxy",
      },
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        let details: unknown = null;
        try {
          details = await error.context.json();
        } catch {
          details = null;
        }
        return NextResponse.json(
          {
            generatedAt,
            error: "Supabase Edge Function returned HTTP error.",
            details,
          },
          { status: 502 },
        );
      }

      if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
        return NextResponse.json(
          {
            generatedAt,
            error: "Supabase Edge relay/fetch error.",
            details: error.message,
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          generatedAt,
          error: "Unknown Supabase Edge invocation error.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        generatedAt,
        edgeGeneratedAt:
          data && typeof data === "object" && "generatedAt" in data
            ? (data.generatedAt as string)
            : null,
        latencyMs: Math.round(performance.now() - startedAt),
        data,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
          "X-Generated-At": generatedAt,
          "X-Cache-Mode": "edge-function-proxy",
          "X-Data-Source": "supabase-edge-function:pulse",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        generatedAt,
        error: "Unhandled error invoking Supabase Edge Function.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
