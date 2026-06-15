import cron from "node-cron";
import { env } from "@/src/config/env";
import { prisma } from "@/src/db/prisma";
import { NewsIngestor } from "@/src/ingestion/ingestor";
import { logger } from "@/src/logging/logger";
import { BriefService } from "@/src/briefs/briefService";

export async function refreshMorningBrief(): Promise<string> {
  logger.info("Starting Morning Brief refresh");
  const ingestor = new NewsIngestor(prisma);
  await ingestor.ingestRecent();
  const briefId = await new BriefService(prisma).generateToday();
  logger.info("Completed Morning Brief refresh", { briefId });
  return briefId;
}

export function scheduleDailyRefresh(onComplete?: (briefId: string) => void): void {
  cron.schedule(
    env.MORNING_BRIEF_REFRESH_CRON,
    async () => {
      try {
        const briefId = await refreshMorningBrief();
        onComplete?.(briefId);
      } catch (error) {
        logger.error("Scheduled refresh failed", error);
      }
    },
    { timezone: env.MORNING_BRIEF_TIMEZONE }
  );
}
