import { createClient } from "@supabase/supabase-js";

export function createSupabaseFunctionsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or key for functions invocation.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function invokeSupabaseFunction<TResponse>(
  functionName: string,
  body?: Record<string, unknown>,
) {
  const supabase = createSupabaseFunctionsClient();
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    throw new Error(`[${functionName}] ${error.message}`);
  }

  return data as TResponse;
}
