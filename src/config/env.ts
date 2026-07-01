import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  MORNING_BRIEF_REFRESH_CRON: z.string().default("0 7 * * *"),
  MORNING_BRIEF_TIMEZONE: z.string().default("Asia/Karachi"),
  MORNING_BRIEF_LOOKBACK_HOURS: z.coerce.number().int().positive().default(24),
  X_BEARER_TOKEN: z.string().optional(),
  X_MAX_RESULTS: z.coerce.number().int().min(10).max(100).default(25)
});

export const env = envSchema.parse(process.env);
