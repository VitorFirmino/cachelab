import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabasePublicEnv();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or public Supabase key.");
  }

  return createBrowserClient(
    url,
    key,
  );
}
