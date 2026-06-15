import { NextResponse } from "next/server";
import { refreshMorningBrief } from "@/src/scheduler/refreshJob";

export async function POST() {
  const briefId = await refreshMorningBrief();
  return NextResponse.json({ briefId });
}
