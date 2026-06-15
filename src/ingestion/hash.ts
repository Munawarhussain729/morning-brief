import { createHash } from "node:crypto";

export function articleHash(title: string, url: string): string {
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedUrl = url.split("?")[0].replace(/\/$/, "");
  return createHash("sha256").update(`${normalizedTitle}|${normalizedUrl}`).digest("hex");
}
