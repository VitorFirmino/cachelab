import { beforeEach, describe, expect, it, vi } from "vitest";

class FunctionsHttpError extends Error {
  context: { json: () => Promise<unknown> };

  constructor(message: string, details: unknown) {
    super(message);
    this.context = {
      json: async () => details,
    };
  }
}

class FunctionsRelayError extends Error {}
class FunctionsFetchError extends Error {}

const mockInvoke = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
}));

vi.mock("@/lib/supabase/functions", () => ({
  createSupabaseFunctionsClient: () => ({
    functions: {
      invoke: mockInvoke,
    },
  }),
}));

async function loadPulseRoute() {
  return import("@/app/api/pulse/route");
}

describe("GET /api/pulse", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(performance, "now").mockReturnValueOnce(100).mockReturnValueOnce(132.3);
  });

  it("returns successful edge proxy payload with headers", async () => {
    const { GET } = await loadPulseRoute();
    mockInvoke.mockResolvedValueOnce({
      data: { generatedAt: "2026-01-01T00:00:00.000Z", events: [{ id: 1 }] },
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/pulse?limit=4"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.edgeGeneratedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(body.latencyMs).toBe(32);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=10, stale-while-revalidate=60",
    );
    expect(response.headers.get("x-cache-mode")).toBe("edge-function-proxy");
    expect(mockInvoke).toHaveBeenCalledWith("pulse", {
      body: { limit: 4 },
      headers: { "x-cachelab-source": "next-api-proxy" },
    });
  });

  it("maps FunctionsHttpError to 502 with details", async () => {
    const { GET } = await loadPulseRoute();
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new FunctionsHttpError("http error", { reason: "bad payload" }),
    });

    const response = await GET(new Request("http://localhost/api/pulse"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Supabase Edge Function returned HTTP error.");
    expect(body.details).toEqual({ reason: "bad payload" });
  });

  it("maps relay/fetch errors to 502", async () => {
    const { GET } = await loadPulseRoute();
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new FunctionsRelayError("relay down"),
    });

    const response = await GET(new Request("http://localhost/api/pulse?limit=999"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Supabase Edge relay/fetch error.");
    expect(body.details).toBe("relay down");
    expect(mockInvoke).toHaveBeenCalledWith("pulse", {
      body: { limit: 20 },
      headers: { "x-cachelab-source": "next-api-proxy" },
    });
  });

  it("returns 500 on unhandled thrown exceptions", async () => {
    const { GET } = await loadPulseRoute();
    mockInvoke.mockRejectedValueOnce(new Error("network crash"));

    const response = await GET(new Request("http://localhost/api/pulse"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Unhandled error invoking Supabase Edge Function.");
    expect(body.details).toBe("network crash");
  });
});
