import { NextResponse } from "next/server";
import { BriefService } from "@/src/briefs/briefService";
import { prisma } from "@/src/db/prisma";

export async function GET() {
  const service = new BriefService(prisma);
  const [brief, history] = await Promise.all([service.getLatestBrief(), service.getHistory()]);
  return NextResponse.json({ brief, history });
}
