import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseVibes,
  partyCoords,
  haversineKm,
  type Party,
  type PartyCreateInput,
} from "@/lib/types";

function serialize(p: any): Party {
  return {
    id: p.id,
    title: p.title,
    city: p.city,
    area: p.area,
    date: p.date,
    time: p.time,
    fee: p.fee,
    maxGuests: p.maxGuests,
    vibes: p.vibes,
    description: p.description,
    hostName: p.hostName,
    hostId: p.hostId,
    coverUrl: p.coverUrl,
    lat: p.lat,
    lng: p.lng,
    guestCount: p.guestCount,
    securityBooked: p.securityBooked,
    securityFee: p.securityFee,
    securityStatus: p.securityStatus,
    createdAt: p.createdAt.toISOString(),
  };
}

// GET /api/parties?city=Delhi&vibe=Techno&q=rooftop
// GET /api/parties?lat=28.61&lng=77.20&radiusKm=5  — proximity filter (map view)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const vibe = searchParams.get("vibe");
  const q = searchParams.get("q")?.trim().toLowerCase();

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = searchParams.get("radiusKm");
  const hasProximity =
    lat !== null && lng !== null && radiusKm !== null &&
    !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng)) &&
    !Number.isNaN(parseFloat(radiusKm));

  const parties = await db.party.findMany({
    where: {
      ...(city ? { city } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  let filtered = parties;
  if (vibe) {
    filtered = filtered.filter((p) => parseVibes(p.vibes).includes(vibe));
  }
  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  // Proximity filter — keep only parties within radiusKm of (lat,lng).
  // Falls back to partyGeoFallback (via partyCoords) when the party has no
  // stored lat/lng, so older seeded parties still appear on the map.
  if (hasProximity) {
    const center = { lat: parseFloat(lat!), lng: parseFloat(lng!) };
    const radius = parseFloat(radiusKm!);
    filtered = filtered.filter((p) => {
      const coords = partyCoords({
        lat: p.lat,
        lng: p.lng,
        id: p.id,
        city: p.city,
      });
      return haversineKm(center, coords) <= radius;
    });
  }

  return NextResponse.json({ parties: filtered.map(serialize) });
}

// POST /api/parties
export async function POST(req: NextRequest) {
  let body: PartyCreateInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    city,
    area,
    date,
    time,
    fee,
    maxGuests,
    vibes,
    description,
    hostName,
    coverUrl,
    lat,
    lng,
    securityBooked,
    securityFee,
  } = body;

  if (!title || !city || !area || !date || !time || !hostName) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // try to associate with a host user by hostName
  const host = await db.user.findFirst({ where: { name: hostName } });

  const party = await db.party.create({
    data: {
      title,
      city,
      area,
      date,
      time,
      fee: Number(fee) || 0,
      maxGuests: Number(maxGuests) || 10,
      vibes: (vibes || []).join(","),
      description: description || "",
      hostName,
      hostId: host?.id,
      coverUrl: coverUrl || null,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      guestCount: 0,
      securityBooked: Boolean(securityBooked),
      securityFee: Number(securityFee) || 0,
      securityStatus: securityBooked ? "requested" : "",
    },
  });

  if (host) {
    await db.user.update({
      where: { id: host.id },
      data: { hosted: { increment: 1 } },
    });
  }

  return NextResponse.json({ party: serialize(party) }, { status: 201 });
}
