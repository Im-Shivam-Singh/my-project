import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currencyForCity } from "@/lib/types";

// GET /api/orders?userId=...  → list a user's orders (with items + party)
// GET /api/orders?partyId=... → list orders for a party (host view)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const partyId = req.nextUrl.searchParams.get("partyId");

  if (!userId && !partyId) {
    return NextResponse.json(
      { error: "userId or partyId is required" },
      { status: 400 },
    );
  }

  const where = userId ? { userId } : { partyId: partyId ?? undefined };
  const orders = await db.order.findMany({
    where,
    include: {
      items: true,
      party: true,
      ticket: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

// POST /api/orders  → create an order (entry + optional add-ons) + ticket
// Body: { userId, partyId, items: [{ menuItemId?, name, emoji, unitPrice, quantity }] }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, partyId, items } = body;
  if (!userId || !partyId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "userId, partyId, and items[] are required" },
      { status: 400 },
    );
  }

  const party = await db.party.findUnique({ where: { id: partyId } });
  if (!party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  const currency = currencyForCity(party.city);
  const totalAmount = items.reduce(
    (sum: number, it: any) => sum + it.unitPrice * it.quantity,
    0,
  );

  // Create order + items + ticket in one transaction
  const order = await db.order.create({
    data: {
      userId,
      partyId,
      totalAmount,
      currency,
      status: "paid", // mock — no real Stripe in dev
      items: {
        create: items.map((it: any) => ({
          menuItemId: it.menuItemId ?? null,
          name: it.name,
          emoji: it.emoji || "🎟️",
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        })),
      },
    },
    include: { items: true },
  });

  const ticket = await db.ticket.create({
    data: {
      orderId: order.id,
      userId,
      partyId,
      qrHash: `vm-${order.id.slice(-8).toUpperCase()}-${partyId.slice(-4).toUpperCase()}`,
    },
  });

  // Increment the party's guest count
  await db.party.update({
    where: { id: partyId },
    data: { guestCount: { increment: 1 } },
  });

  return NextResponse.json({ order, ticket }, { status: 201 });
}
