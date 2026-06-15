import { Notification } from "electron";
import type { DailyBrief, BriefItem } from "@prisma/client";

export function notifyForMajorUpdates(brief: DailyBrief & { items: BriefItem[] }): void {
  const alertItems = brief.items.filter((item) => {
    const text = `${item.title} ${item.summary} ${item.whyItMatters}`.toLowerCase();
    return item.section === "CYBERSECURITY" && /critical|zero-day|rce|cve-/.test(text)
      || item.section === "AI" && /release|launch|model|agent/.test(text)
      || item.section === "DEVELOPMENT" && /stable|major|release|breaking/.test(text);
  });

  for (const item of alertItems.slice(0, 3)) {
    new Notification({
      title: `Morning Brief: ${item.title}`,
      body: item.whyItMatters || item.summary,
      urgency: item.section === "CYBERSECURITY" ? "critical" : "normal"
    }).show();
  }
}
