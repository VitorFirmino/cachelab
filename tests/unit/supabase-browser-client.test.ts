import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateBrowserClient = vi.fn();
const mockGetSupabasePublicEnv = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicEnv: mockGetSupabasePublicEnv,
}));

describe("createSupabaseBrowserClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("throws when public url or key is missing", async () => {
    mockGetSupabasePublicEnv.mockReturnValueOnce({ url: undefined, key: undefined });
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");

    expect(() => createSupabaseBrowserClient()).toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL or public Supabase key.",
    );
  });

  it("creates browser client with env credentials", async () => {
    mockGetSupabasePublicEnv.mockReturnValueOnce({
      url: "https://project.supabase.co",
      key: "publishable-key",
    });
    mockCreateBrowserClient.mockReturnValueOnce({ ok: true });
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");

    const client = createSupabaseBrowserClient();

    expect(client).toEqual({ ok: true });
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "publishable-key",
    );
  });
});
