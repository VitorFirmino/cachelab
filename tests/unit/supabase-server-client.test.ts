import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookies = vi.fn();
const mockCreateServerClient = vi.fn();
const mockGetSupabasePublicEnv = vi.fn();

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicEnv: mockGetSupabasePublicEnv,
}));

describe("createSupabaseServerClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("throws when url/key are missing", async () => {
    mockCookies.mockResolvedValueOnce({
      getAll: () => [],
      set: vi.fn(),
    });
    mockGetSupabasePublicEnv.mockReturnValueOnce({ url: undefined, key: undefined });

    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    await expect(createSupabaseServerClient()).rejects.toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL or public Supabase key.",
    );
  });

  it("creates server client and exposes cookie bridge", async () => {
    const cookieStore = {
      getAll: vi.fn(() => [{ name: "sb", value: "1" }]),
      set: vi.fn(),
    };
    mockCookies.mockResolvedValueOnce(cookieStore);
    mockGetSupabasePublicEnv.mockReturnValueOnce({
      url: "https://project.supabase.co",
      key: "publishable-key",
    });
    mockCreateServerClient.mockReturnValueOnce({ ok: true });

    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const client = await createSupabaseServerClient();

    expect(client).toEqual({ ok: true });
    const call = mockCreateServerClient.mock.calls[0];
    expect(call[0]).toBe("https://project.supabase.co");
    expect(call[1]).toBe("publishable-key");
    const options = call[2];
    expect(options.cookies.getAll()).toEqual([{ name: "sb", value: "1" }]);
    options.cookies.setAll([{ name: "a", value: "b", options: { path: "/" } }]);
    expect(cookieStore.set).toHaveBeenCalledWith("a", "b", { path: "/" });
  });

  it("swallows cookie set errors in restricted contexts", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw new Error("readonly");
      }),
    };
    mockCookies.mockResolvedValueOnce(cookieStore);
    mockGetSupabasePublicEnv.mockReturnValueOnce({
      url: "https://project.supabase.co",
      key: "publishable-key",
    });
    mockCreateServerClient.mockReturnValueOnce({ ok: true });

    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    await createSupabaseServerClient();

    const options = mockCreateServerClient.mock.calls[0][2];
    expect(() =>
      options.cookies.setAll([{ name: "x", value: "1", options: {} }]),
    ).not.toThrow();
  });
});
