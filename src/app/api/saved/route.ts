import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/saved?userId=... — list saved party IDs for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const saved = await db.savedParty.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { party: true },
  });

  return NextResponse.json({
    saved: saved.map((s) => ({
      id: s.id,
      partyId: s.partyId,
      createdAt: s.createdAt.toISOString(),
      party: {
        id: s.party.id,
        title: s.party.title,
        city: s.party.city,
        area: s.party.area,
        date: s.party.date,
        time: s.party.time,
        fee: s.party.fee,
        maxGuests: s.party.maxGuests,
        vibes: s.party.vibes,
        description: s.party.description,
        hostName: s.party.hostName,
        hostId: s.party.hostId,
        coverUrl: s.party.coverUrl,
        guestCount: s.party.guestCount,
        createdAt: s.party.createdAt.toISOString(),
      },
    })),
    partyIds: saved.map((s) => s.partyId),
  });
}

// POST /api/saved — save a party
export async function POST(req: NextRequest) {
  let body: { userId: string; partyId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { userId, partyId } = body;
  if (!userId || !partyId) {
    return NextResponse.json(
      { error: "userId and partyId required" },
      { status: 400 },
    );
  }

  const existing = await db.savedParty.findUnique({
    where: { userId_partyId: { userId, partyId } },
  });
  if (existing) {
    // toggle: unsave
    await db.savedParty.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false, partyId });
  }

  await db.savedParty.create({ data: { userId, partyId } });
  return NextResponse.json({ saved: true, partyId }, { status: 201 });
}

// DELETE /api/saved?userId=...&partyId=... — unsave a party
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const partyId = searchParams.get("partyId");
  if (!userId || !partyId) {
    return NextResponse.json(
      { error: "userId and partyId required" },
      { status: 400 },
    );
  }

  const existing = await db.savedParty.findUnique({
    where: { userId_partyId: { userId, partyId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not saved" }, { status: 404 });
  }

  await db.savedParty.delete({ where: { id: existing.id } });
  return NextResponse.json({ saved: false, partyId });
}
