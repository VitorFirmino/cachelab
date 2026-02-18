import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignOut = vi.fn();
const mockCreateServerClient = vi.fn(async () => ({
  auth: {
    signOut: mockSignOut,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateServerClient,
}));

const ORIGINAL_ENV = { ...process.env };

describe("GET /logout", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it("signs out and redirects to site login URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cachelab.app";
    const { GET } = await import("@/app/logout/route");

    const response = await GET();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cachelab.app/login");
  });

  it("falls back to localhost when NEXT_PUBLIC_SITE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { GET } = await import("@/app/logout/route");

    const response = await GET();

    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
