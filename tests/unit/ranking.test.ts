import { describe, expect, it } from "vitest";
import { scoreArticle } from "@/src/ingestion/ranking";

describe("scoreArticle", () => {
  it("prioritizes critical security updates", () => {
    const result = scoreArticle({
      sourceName: "Security Blog",
      category: "CYBERSECURITY",
      title: "Critical RCE vulnerability CVE-2026-12345 announced",
      url: "https://example.com/cve",
      rawSummary: "Patch immediately"
    });

    expect(result.relevanceScore).toBeGreaterThan(4);
    expect(result.isMarketing).toBe(false);
  });

  it("downranks marketing content", () => {
    const result = scoreArticle({
      sourceName: "Vendor",
      category: "AI",
      title: "Partner announcement webinar",
      url: "https://example.com/webinar"
    });

    expect(result.isMarketing).toBe(true);
  });
});
