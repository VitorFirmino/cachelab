import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn(async () => ({
  auth: {
    getUser: mockGetUser,
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateServerClient,
}));

const ORIGINAL_ENV = { ...process.env };

describe("auth helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("isAdminUser honors role metadata and email allowlist", async () => {
    const { isAdminUser } = await import("@/lib/auth");
    process.env.ADMIN_EMAILS = "admin@cachelab.dev, another@example.com";

    expect(
      isAdminUser({
        app_metadata: { role: "admin" },
      } as never),
    ).toBe(true);
    expect(
      isAdminUser({
        email: "ADMIN@cachelab.dev",
        app_metadata: {},
        user_metadata: {},
      } as never),
    ).toBe(true);
    expect(
      isAdminUser({
        email: "user@cachelab.dev",
        app_metadata: {},
        user_metadata: {},
      } as never),
    ).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });

  it("requireUser redirects when no authenticated user exists", async () => {
    const { requireUser } = await import("@/lib/auth");
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("requireUser returns current user when authenticated", async () => {
    const { requireUser } = await import("@/lib/auth");
    const user = { id: "u1", email: "user@cachelab.dev", app_metadata: {}, user_metadata: {} };
    mockGetUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    await expect(requireUser()).resolves.toEqual(user);
  });

  it("requireAdmin redirects non-admin users", async () => {
    const { requireAdmin } = await import("@/lib/auth");
    const user = { id: "u2", email: "user@cachelab.dev", app_metadata: {}, user_metadata: {} };
    mockGetUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/login?error=not_admin");
    expect(mockRedirect).toHaveBeenCalledWith("/login?error=not_admin");
  });
});
