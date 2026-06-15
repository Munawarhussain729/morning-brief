import { describe, expect, it } from "vitest";
import { articleHash } from "@/src/ingestion/hash";

describe("articleHash", () => {
  it("normalizes query strings and whitespace", () => {
    expect(articleHash(" New   Tool ", "https://example.com/a?ref=x")).toBe(
      articleHash("new tool", "https://example.com/a")
    );
  });
});
