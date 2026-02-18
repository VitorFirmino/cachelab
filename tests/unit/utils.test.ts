import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional and duplicate Tailwind classes", () => {
    const result = cn("px-2", "px-4", "text-sm", false && "hidden", undefined);
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
    expect(result).toContain("text-sm");
  });
});
