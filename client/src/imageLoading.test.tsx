import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(
  fileURLToPath(new URL("../index.html", import.meta.url)),
  "utf8"
);

describe("image loading strategy", () => {
  it("preloads the hero image and references the first cabinet image locally", () => {
    expect(indexHtml).toContain('rel="preload"');
    expect(indexHtml).toContain('as="image"');
    expect(indexHtml).toContain(
      "/manus-storage/sakina-market-hero_375359ff.jpg"
    );
    expect(indexHtml).toContain(
      "/assets/sakina-raw-earth-stone_6b705978-1200_337052dd.webp"
    );
  });
});
