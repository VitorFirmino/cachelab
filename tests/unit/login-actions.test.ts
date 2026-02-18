import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const mockSignInWithPassword = vi.fn();
const mockCreateServerClient = vi.fn(async () => ({
  auth: {
    signInWithPassword: mockSignInWithPassword,
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateServerClient,
}));

function buildFormData(email = "admin@cachelab.dev", password = "secret", next = "/admin") {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  formData.set("next", next);
  return formData;
}

describe("signInAction", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("validates required email and password", async () => {
    const { signInAction } = await import("@/app/login/actions");
    const empty = new FormData();

    await expect(signInAction({}, empty)).resolves.toEqual({
      error: "Informe email e senha.",
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("returns invalid credentials message on auth failure", async () => {
    const { signInAction } = await import("@/app/login/actions");
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "invalid login" },
    });

    await expect(signInAction({}, buildFormData())).resolves.toEqual({
      error: "Credenciais inválidas.",
    });
  });

  it("redirects to next path when login succeeds", async () => {
    const { signInAction } = await import("@/app/login/actions");
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    await expect(signInAction({}, buildFormData("admin@cachelab.dev", "secret", "/admin/stats"))).rejects.toThrow(
      "REDIRECT:/admin/stats",
    );
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "admin@cachelab.dev",
      password: "secret",
    });
  });
});
