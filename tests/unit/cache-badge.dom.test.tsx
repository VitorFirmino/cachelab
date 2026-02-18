// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CacheBadge } from "@/components/cache-badge";

describe("CacheBadge", () => {
  it("renders correct labels for known statuses", () => {
    render(<CacheBadge status="HIT" />);
    expect(screen.getByText("HIT")).toBeInTheDocument();
  });

  it("renders translated labels for warning/error states", () => {
    const { rerender } = render(<CacheBadge status="REVALIDATING" />);
    expect(screen.getByText("REVALIDANDO")).toBeInTheDocument();

    rerender(<CacheBadge status="ERROR" />);
    expect(screen.getByText("ERRO")).toBeInTheDocument();
  });
});
