import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/views — record a party view
export async function POST(req: NextRequest) {
  let body: { partyId: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { partyId, userId } = body;
  if (!partyId) {
    return NextResponse.json({ error: "partyId required" }, { status: 400 });
  }

  await db.partyView.create({
    data: { partyId, userId: userId || null },
  });

  return NextResponse.json({ recorded: true }, { status: 201 });
}

// GET /api/views?partyId=... — get view count for a party
// GET /api/views?hostId=... — get total views across all hosted parties
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const partyId = searchParams.get("partyId");
  const hostId = searchParams.get("hostId");

  if (partyId) {
    const count = await db.partyView.count({ where: { partyId } });
    return NextResponse.json({ partyId, views: count });
  }

  if (hostId) {
    // Total views across all parties hosted by this user
    const parties = await db.party.findMany({
      where: { hostId },
      select: { id: true },
    });
    const partyIds = parties.map((p) => p.id);
    const views = await db.partyView.count({
      where: { partyId: { in: partyIds } },
    });
    // Also get per-party breakdown
    const breakdown = await db.partyView.groupBy({
      by: ["partyId"],
      where: { partyId: { in: partyIds } },
      _count: { id: true },
    });
    return NextResponse.json({
      hostId,
      totalViews: views,
      partyCount: parties.length,
      breakdown: breakdown.map((b) => ({
        partyId: b.partyId,
        views: b._count.id,
      })),
    });
  }

  return NextResponse.json(
    { error: "partyId or hostId required" },
    { status: 400 },
  );
}
