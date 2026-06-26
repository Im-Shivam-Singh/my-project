import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tickets?userId=...  → list a user's tickets (with party + order)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }
  const tickets = await db.ticket.findMany({
    where: { userId },
    include: {
      party: true,
      order: { include: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tickets });
}
