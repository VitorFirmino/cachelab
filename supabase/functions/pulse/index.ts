import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type PulseEvent = {
  id: number;
  type: string;
  message: string;
  productId: number | null;
  createdAt: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { limit: bodyLimit } = await req.json().catch(() => ({ limit: 5 }));
    const limit = Number.isFinite(Number(bodyLimit))
      ? Math.max(1, Math.min(Number(bodyLimit), 20))
      : 5;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      },
    );

    const eventsRes = await supabase
      .from("Event")
      .select("id,type,message,productId,createdAt")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (eventsRes.error) {
      return new Response(
        JSON.stringify({
          error: "Failed to query events.",
          details: eventsRes.error.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const now = new Date();
    const from24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const countRes = await supabase
      .from("Event")
      .select("id", { count: "exact", head: true })
      .gte("createdAt", from24h);

    if (countRes.error) {
      return new Response(
        JSON.stringify({
          error: "Failed to count 24h events.",
          details: countRes.error.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const events = (eventsRes.data ?? []) as PulseEvent[];

    return new Response(
      JSON.stringify({
        generatedAt: now.toISOString(),
        source: "supabase-edge-function",
        ttlSeconds: 10,
        summary: {
          recentEvents: events.length,
          eventsLast24h: countRes.count ?? 0,
        },
        events,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
          "X-Data-Source": "supabase-edge-function:pulse",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected pulse function failure.",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
