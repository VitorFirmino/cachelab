import { afterEach, describe, expect, it } from "vitest";

import { getBaseUrl } from "@/lib/url";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getBaseUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cachelab.app///";
    process.env.VERCEL_URL = "cachelab.vercel.app";

    expect(getBaseUrl()).toBe("https://cachelab.app");
  });

  it("falls back to VERCEL_URL when NEXT_PUBLIC_SITE_URL is absent", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "cachelab.vercel.app";

    expect(getBaseUrl()).toBe("https://cachelab.vercel.app");
  });

  it("falls back to localhost when no public URL env is defined", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;

    expect(getBaseUrl()).toBe("http://localhost:3000");
  });
});
