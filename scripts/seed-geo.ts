// Seed lat/lng on all existing parties based on their city + a deterministic
// offset (so each party lands at a slightly different spot within the city).
// Run with: bun run scripts/seed-geo.ts
import { db } from "@/lib/db";
import { CITY_CENTERS } from "@/lib/types";

// Hand-picked offsets per area (within each city) so pins feel realistic
// rather than randomly scattered. Falls back to a deterministic hash if the
// area isn't listed.
const AREA_OFFSETS: Record<string, { lat: number; lng: number }> = {
  // Delhi
  "Hauz Khas Village": { lat: 28.5522, lng: 77.1937 },
  "Connaught Place": { lat: 28.6315, lng: 77.2167 },
  "Cyber Hub": { lat: 28.4949, lng: 77.0894 },
  "Sector 29": { lat: 28.4684, lng: 77.0717 },
  // Mumbai
  "Bandraf West": { lat: 19.0596, lng: 72.8295 }, // typo-tolerant
  "Bandstand": { lat: 19.0505, lng: 72.8196 },
  "Lower Parel": { lat: 19.0044, lng: 72.8322 },
  "Colaba": { lat: 18.9067, lng: 72.8147 },
  // Bangalore
  "Indiranagar 100ft Road": { lat: 12.9784, lng: 77.6408 },
  "Koramangala 5th Block": { lat: 12.9352, lng: 77.6245 },
  "MG Road": { lat: 12.9756, lng: 77.6066 },
  "Indiranagar": { lat: 12.9719, lng: 77.6412 },
  "Koramangala": { lat: 12.9352, lng: 77.6245 },
  // Goa
  "Anjuna": { lat: 15.5743, lng: 73.7417 },
  "Vagator": { lat: 15.6014, lng: 73.7388 },
  "Arambol": { lat: 15.6846, lng: 73.7036 },
  // Pune
  "Koregaon Park": { lat: 18.5362, lng: 73.8939 },
  "Baner": { lat: 18.5598, lng: 73.7717 },
  "Viman Nagar": { lat: 18.5679, lng: 73.9143 },
};

function fallbackOffset(seed: string, city: string) {
  const center = CITY_CENTERS[city] ?? { lat: 28.6139, lng: 77.209 };
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const dLat = ((h % 800) - 400) / 12000; // -0.033..+0.033 deg ≈ ±3.7km
  const dLng = (((h >> 8) % 800) - 400) / 12000;
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

async function main() {
  console.log("Seeding geo coordinates on parties...");
  const parties = await db.party.findMany();
  let updated = 0;
  let skipped = 0;
  for (const p of parties) {
    if (p.lat !== null && p.lng !== null) {
      skipped++;
      continue;
    }
    const areaKey = Object.keys(AREA_OFFSETS).find((a) =>
      p.area.toLowerCase().includes(a.toLowerCase().split(" ")[0]),
    );
    const coords = areaKey
      ? AREA_OFFSETS[areaKey]
      : fallbackOffset(p.id + p.title, p.city);
    await db.party.update({
      where: { id: p.id },
      data: { lat: coords.lat, lng: coords.lng },
    });
    updated++;
    console.log(`  ✓ ${p.title} @ ${p.area}, ${p.city} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
  }
  console.log(`Done. Updated ${updated}, already-had-coords ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
