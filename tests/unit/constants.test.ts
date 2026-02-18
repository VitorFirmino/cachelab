import { describe, expect, it } from "vitest";

import { CATEGORY_ICON_FALLBACK, CATEGORY_ICONS, getCategoryIcon } from "@/lib/constants";

describe("category icon helpers", () => {
  it("returns mapped icon for known categories", () => {
    expect(getCategoryIcon("Eletrônicos")).toBe("⚡");
    expect(getCategoryIcon("Gaming")).toBe("🎮");
    expect(CATEGORY_ICONS["Áudio"]).toBe("🎧");
  });

  it("returns fallback icon for unknown or empty categories", () => {
    expect(getCategoryIcon("Unknown")).toBe(CATEGORY_ICON_FALLBACK);
    expect(getCategoryIcon(undefined)).toBe(CATEGORY_ICON_FALLBACK);
    expect(getCategoryIcon(null)).toBe(CATEGORY_ICON_FALLBACK);
  });
});
