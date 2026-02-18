// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cacheStats: vi.fn(),
  getLastRequest: vi.fn(),
}));

vi.mock("@/service/api-cache", () => ({
  cacheStats: mocks.cacheStats,
}));

vi.mock("@/service/api-client", () => ({
  getLastRequest: mocks.getLastRequest,
}));

import { CacheIndicator } from "@/components/cache-indicator";

describe("CacheIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders null when there is no cache data and no last request", () => {
    mocks.cacheStats.mockReturnValue({ entries: 0, hits: 0, misses: 0 });
    mocks.getLastRequest.mockReturnValue(null);

    const { container } = render(<CacheIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders stats and toggles details with keyboard shortcut", () => {
    mocks.cacheStats.mockReturnValue({ entries: 2, hits: 4, misses: 1 });
    mocks.getLastRequest.mockReturnValue({ url: "/api/products", hit: true, durationMs: 0 });

    render(<CacheIndicator />);
    expect(screen.getByRole("button", { name: /Cache: 2/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "c" });
    expect(screen.getByText("Client Cache Stats")).toBeInTheDocument();
    expect(screen.getByText("Entries")).toBeInTheDocument();
  });

  it("refreshes stats on interval tick", () => {
    mocks.cacheStats
      .mockReturnValueOnce({ entries: 1, hits: 1, misses: 0 })
      .mockReturnValueOnce({ entries: 3, hits: 5, misses: 2 });
    mocks.getLastRequest
      .mockReturnValueOnce({ url: "/api/featured", hit: true, durationMs: 0 })
      .mockReturnValueOnce({ url: "/api/products", hit: false, durationMs: 32 });

    render(<CacheIndicator />);
    expect(screen.getByRole("button", { name: /Cache: 1/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("button", { name: /Cache: 3/i })).toBeInTheDocument();
    expect(screen.getByText("MISS")).toBeInTheDocument();
  });
});
