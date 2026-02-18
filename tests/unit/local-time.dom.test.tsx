// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LocalTime } from "@/components/local-time";

describe("LocalTime", () => {
  it("renders formatted output for datetime/date/time", () => {
    const iso = "2026-01-01T10:30:00";
    const { rerender } = render(<LocalTime date={iso} format="datetime" />);
    expect(screen.getByText((text) => text.length > 0)).toBeInTheDocument();

    rerender(<LocalTime date={iso} format="date" />);
    expect(screen.getByText((text) => text.length > 0)).toBeInTheDocument();

    rerender(<LocalTime date={iso} format="time" />);
    expect(screen.getByText((text) => text.length > 0)).toBeInTheDocument();
  });
});
