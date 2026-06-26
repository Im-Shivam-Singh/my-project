import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/menus?partyId=...  → list menu items for a party
export async function GET(req: NextRequest) {
  const partyId = req.nextUrl.searchParams.get("partyId");
  if (!partyId) {
    return NextResponse.json(
      { error: "partyId is required" },
      { status: 400 },
    );
  }
  const items = await db.menuItem.findMany({
    where: { partyId },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ items });
}

// POST /api/menus  → add a menu item (host only)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partyId, name, price, emoji, category } = body;
  if (!partyId || !name) {
    return NextResponse.json(
      { error: "partyId and name are required" },
      { status: 400 },
    );
  }
  const item = await db.menuItem.create({
    data: {
      partyId,
      name,
      price: Number(price) || 0,
      emoji: emoji || "🍹",
      category: category || "drink",
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
