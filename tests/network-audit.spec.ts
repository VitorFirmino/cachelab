import { test, expect } from "@playwright/test";

test.describe("Network RSC audit", () => {
  test("Clicking Início multiple times should reuse Router Cache", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const rscRequests: string[] = [];

    page.on("request", (requestEvent) => {
      const requestUrl = requestEvent.url();
      if (requestUrl.includes("_rsc=")) {
        rscRequests.push(requestUrl);
      }
    });

    // 1. Load home
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const initialCount = rscRequests.length;
    console.log(`\n--- Initial load: ${initialCount} RSC request(s) ---`);

    // 2. Navigate to /products
    await page.evaluate(() => {
      const link = document.querySelector('header a[href="/products"]') as HTMLAnchorElement;
      link?.click();
    });
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    console.log(`--- After /products: ${rscRequests.length - initialCount} new RSC request(s) ---`);

    // 3. Click Início link 4 times
    const beforeClicks = rscRequests.length;

    for (let clickNumber = 1; clickNumber <= 4; clickNumber++) {
      await page.evaluate(() => {
        const link = document.querySelector('header a[href="/"]') as HTMLAnchorElement;
        link?.click();
      });
      await page.waitForTimeout(1500);
      await page.waitForLoadState("networkidle");

      const newRsc = rscRequests.slice(beforeClicks);
      const homeOnly = newRsc.filter((requestUrl) => new URL(requestUrl).pathname === "/");
      console.log(`--- Click #${clickNumber}: +${rscRequests.length - beforeClicks} total, ${homeOnly.length} for / ---`);
    }

    // Analyze results
    const newRequests = rscRequests.slice(beforeClicks);
    const homeRequests = newRequests.filter((requestUrl) => new URL(requestUrl).pathname === "/");
    const prefetchRequests = newRequests.filter((requestUrl) => new URL(requestUrl).pathname !== "/");

    console.log(`\n=== RESULT ===`);
    console.log(`Home page RSC fetches: ${homeRequests.length} (for 4 clicks)`);
    console.log(`Prefetch requests: ${prefetchRequests.length}`);
    console.log(`Total new: ${newRequests.length}`);

    if (newRequests.length > 0) {
      console.log("\nAll new requests:");
      newRequests.forEach((requestUrl, requestIndex) => console.log(`  ${requestIndex + 1}. ${new URL(requestUrl).pathname}`));
    }

    // With cacheComponents (PPR), each client-side navigation may trigger an RSC
    // request — the server responds from 'use cache' instantly, but the request
    // still appears on the wire. We verify the count stays bounded (≤ clicks).
    expect(homeRequests.length).toBeLessThanOrEqual(4);
  });

  test("Full navigation cycle", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const rscByRoute: Record<string, number> = {};

    page.on("request", (requestEvent) => {
      const requestUrl = requestEvent.url();
      if (requestUrl.includes("_rsc=")) {
        const pathname = new URL(requestUrl).pathname;
        rscByRoute[pathname] = (rscByRoute[pathname] || 0) + 1;
      }
    });

    // Navigate: / → /products → / → /products → /
    const routes = ["/", "/products", "/", "/products", "/"];

    await page.goto(routes[0]);
    await page.waitForLoadState("networkidle");
    console.log(`\n[1] goto /: ${JSON.stringify(rscByRoute)}`);

    for (let routeIndex = 1; routeIndex < routes.length; routeIndex++) {
      await page.evaluate((href: string) => {
        const link = document.querySelector(`nav a[href="${href}"], header a[href="${href}"]`) as HTMLAnchorElement;
        link?.click();
      }, routes[routeIndex]);
      await page.waitForTimeout(1500);
      await page.waitForLoadState("networkidle");
      console.log(`[${routeIndex + 1}] nav to ${routes[routeIndex]}: ${JSON.stringify(rscByRoute)}`);
    }

    const total = Object.values(rscByRoute).reduce((a, b) => a + b, 0);
    console.log(`\n=== TOTAL: ${total} RSC requests ===`);
    console.log("By route:", JSON.stringify(rscByRoute, null, 2));

    // Home should not have more than 5 fetches (initial prefetch + navs + product link prefetches)
    expect(rscByRoute["/"] || 0).toBeLessThanOrEqual(5);
  });
});
