import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateClient = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

const ORIGINAL_ENV = { ...process.env };

describe("supabase functions helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    mockCreateClient.mockReturnValue({
      functions: {
        invoke: mockInvoke,
      },
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws when URL or key is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    const { createSupabaseFunctionsClient } = await import("@/lib/supabase/functions");
    expect(() => createSupabaseFunctionsClient()).toThrow(
      "Missing Supabase URL or key for functions invocation.",
    );
  });

  it("creates client using service role key priority", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.SUPABASE_ANON_KEY = "anon-key";

    const { createSupabaseFunctionsClient } = await import("@/lib/supabase/functions");
    createSupabaseFunctionsClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "service-key",
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
  });

  it("invokes function and returns typed data", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    mockInvoke.mockResolvedValueOnce({
      data: { products: [{ id: 1 }] },
      error: null,
    });

    const { invokeSupabaseFunction } = await import("@/lib/supabase/functions");
    const result = await invokeSupabaseFunction<{ products: Array<{ id: number }> }>("catalog", {
      op: "featured",
    });

    expect(result).toEqual({ products: [{ id: 1 }] });
    expect(mockInvoke).toHaveBeenCalledWith("catalog", {
      body: { op: "featured" },
    });
  });

  it("throws formatted error when invocation returns error", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "function failed" },
    });

    const { invokeSupabaseFunction } = await import("@/lib/supabase/functions");
    await expect(invokeSupabaseFunction("catalog")).rejects.toThrow(
      "[catalog] function failed",
    );
  });
});
