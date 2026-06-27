import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── PATCH /api/requests/[id]  { status: "accepted" | "rejected" } ─────
// Host action from the requests screen. On accept we post a WhatsApp-style
// "Pay {amount}" CTA message into the 1:1 thread so the guest can pay
// directly from the chat. On reject we post a system message informing the
// guest. guestCount is untouched here (it only moves on payment).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { status: "accepted" | "rejected" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body;
  if (status !== "accepted" && status !== "rejected") {
    return NextResponse.json(
      { error: "status must be 'accepted' or 'rejected'" },
      { status: 400 },
    );
  }

  const existing = await db.joinRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  // Idempotent — no-op if the status is already the target.
  if (existing.status === status) {
    return NextResponse.json({ id, status });
  }

  const party = await db.party.findUnique({
    where: { id: existing.partyId },
    include: { host: true },
  });

  const updated = await db.joinRequest.update({
    where: { id },
    data: { status },
  });

  // ── Post the approval / rejection notice into the 1:1 thread ──────
  if (existing.threadId && party?.host && existing.requesterId) {
    const threadId = existing.threadId;
    const hostId = party.host.id;
    const guestId = existing.requesterId;

    if (status === "accepted") {
      // System notice
      await db.message.create({
        data: {
          threadId,
          senderId: hostId,
          receiverId: guestId,
          content: `✅ ${party.host.name} approved your request. Pay below to lock your spot.`,
          kind: "system",
        },
      });
      // Payment CTA — the guest taps this to go to checkout. The amount is
      // the party entry fee; we embed it in the content for the chat UI.
      const currency = ["Delhi", "Mumbai", "Bangalore", "Goa", "Pune"].includes(
        party.city,
      )
        ? "₹"
        : "£";
      await db.message.create({
        data: {
          threadId,
          senderId: hostId,
          receiverId: guestId,
          content: `Pay ${currency}${party.fee}${party.fee === 0 ? " (free entry — tap to confirm)" : " to confirm your spot"}`,
          kind: "payment",
          requestId: existing.id,
        },
      });
    } else {
      // Rejected
      await db.message.create({
        data: {
          threadId,
          senderId: hostId,
          receiverId: guestId,
          content:
            "❌ Your request was declined for this event. You can't re-apply until it's over.",
          kind: "system",
        },
      });
    }
    await db.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
