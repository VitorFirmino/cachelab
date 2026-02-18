import { afterEach, describe, expect, it } from "vitest";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getSupabasePublicEnv", () => {
  it("prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "default-key";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://project.supabase.co",
      key: "default-key",
    });
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://project.supabase.co",
      key: "publishable-key",
    });

    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(getSupabasePublicEnv()).toEqual({
      url: "https://project.supabase.co",
      key: "anon-key",
    });
  });

  it("returns undefined values when env variables are absent", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(getSupabasePublicEnv()).toEqual({
      url: undefined,
      key: undefined,
    });
  });
});
