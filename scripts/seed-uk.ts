import { db } from "@/lib/db";

// Seed VibeMatch with UK-based demo data per the app-flow spec:
// Edinburgh (primary) + London + Manchester, plus a few India parties.
// All fees in £ for UK parties.

const DEMO_USERS = [
  {
    phone: "+447700900001",
    name: "Aaditya Rao",
    username: "aaditya",
    bio: "Flat parties in Leith · R&B and hip-hop 🎵",
    city: "Edinburgh",
    profession: "Software eng.",
    instagram: "aaditya.nights",
    vibes: 64,
    hosted: 6,
    rating: 4.9,
    ratingCount: 18,
  },
  {
    phone: "+447700900002",
    name: "Priya Sharma",
    username: "priya",
    bio: "Games nights + boardgame evenings in Newington 🎮",
    city: "Edinburgh",
    profession: "Designer",
    instagram: "priya.games",
    vibes: 52,
    hosted: 4,
    rating: 4.8,
    ratingCount: 11,
  },
  {
    phone: "+447700900003",
    name: "Raj Malhotra",
    username: "raj",
    bio: "Bollywood nights + dancing in Marchmont 🌿",
    city: "Edinburgh",
    profession: "Finance",
    instagram: "raj.bollywood",
    vibes: 41,
    hosted: 3,
    rating: 4.7,
    ratingCount: 9,
  },
  {
    phone: "+447700900004",
    name: "Jamie Thompson",
    username: "jamie",
    bio: "Lo-fi & chill · London rooftops 🌙",
    city: "London",
    profession: "Healthcare",
    instagram: "jamie.lofi",
    vibes: 88,
    hosted: 11,
    rating: 5.0,
    ratingCount: 26,
  },
  {
    phone: "+447700900005",
    name: "Maya Khan",
    username: "maya",
    bio: "Retro + vinyl nights in Manchester 📼",
    city: "Manchester",
    profession: "Student",
    instagram: "maya.vinyl",
    vibes: 35,
    hosted: 5,
    rating: 4.6,
    ratingCount: 12,
  },
  {
    phone: "+447700900006",
    name: "Sam Wilson",
    username: "sam",
    bio: "Student · always down for a flat party 🍻",
    city: "Edinburgh",
    profession: "Student",
    vibes: 9,
    hosted: 0,
    rating: 5.0,
    ratingCount: 2,
  },
  {
    phone: "+447700900007",
    name: "You",
    username: "you",
    bio: "Just here for the vibes ✨",
    city: "Edinburgh",
    profession: "Student",
    vibes: 12,
    hosted: 0,
    rating: 5.0,
    ratingCount: 3,
  },
];

// Compute dates relative to "now" so seed is always fresh.
function relDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const DEMO_PARTIES = [
  {
    id: "party_rnb_leith",
    title: "Aaditya's flat party",
    city: "Edinburgh",
    area: "Leith, Edinburgh",
    date: relDate(3),
    time: "21:00",
    fee: 7,
    maxGuests: 15,
    vibes: "R&B,Chill",
    description:
      "R&B night at mine — slow jams, good drinks, and a proper flat session. Small group, good chat, music till late. £7 entry covers the space and snacks; drinks add-on available after you grab your spot.",
    hostName: "Aaditya Rao",
    hostIndex: 0,
    coverEmoji: "🎵",
    coverBg: "#1a1035",
    lat: 55.9667,
    lng: -3.1739,
    guestCount: 8,
    locationRevealHoursBefore: 3,
    menu: [
      { name: "Jack Daniels shot", price: 2, emoji: "🥃", category: "drink" },
      { name: "Small Norfolk can", price: 1, emoji: "🍺", category: "drink" },
      { name: "Nachos plate", price: 4, emoji: "🍟", category: "snack" },
      { name: "Soft drink", price: 1.5, emoji: "🥤", category: "soft" },
    ],
  },
  {
    id: "party_games_newington",
    title: "Priya's games night",
    city: "Edinburgh",
    area: "Newington, Edinburgh",
    date: relDate(2),
    time: "20:00",
    fee: 5,
    maxGuests: 12,
    vibes: "Games,Chill",
    description:
      "Boardgames + chill. Catan, Codenames, and maybe a round of Cards Against Humanity. Bring your A-game. Snacks and soft drinks provided; BYOB welcome.",
    hostName: "Priya Sharma",
    hostIndex: 1,
    coverEmoji: "🎮",
    coverBg: "#0d1f2d",
    lat: 55.9467,
    lng: -3.1832,
    guestCount: 5,
    locationRevealHoursBefore: 3,
    menu: [
      { name: "Craft beer can", price: 2, emoji: "🍺", category: "drink" },
      { name: "Crisps bowl", price: 1, emoji: "🥨", category: "snack" },
      { name: "Soft drink", price: 1, emoji: "🥤", category: "soft" },
    ],
  },
  {
    id: "party_bollywood_marchmont",
    title: "Raj's Bollywood night",
    city: "Edinburgh",
    area: "Marchmont, Edinburgh",
    date: relDate(3),
    time: "22:00",
    fee: 6,
    maxGuests: 13,
    vibes: "Bollywood",
    description:
      "Bollywood + Punjabi beats all night. Dancing mandatory. Come for the music, stay for the samosas. Almost full — grab one of the last spots!",
    hostName: "Raj Malhotra",
    hostIndex: 2,
    coverEmoji: "🌿",
    coverBg: "#1a2410",
    lat: 55.9389,
    lng: -3.1933,
    guestCount: 11,
    locationRevealHoursBefore: 3,
    menu: [
      { name: "Kingfisher can", price: 2, emoji: "🍺", category: "drink" },
      { name: "Samosa plate", price: 3, emoji: "🥟", category: "snack" },
      { name: "Mango lassi", price: 2, emoji: "🥤", category: "soft" },
    ],
  },
  {
    id: "party_lofi_london",
    title: "Jamie's rooftop lo-fi",
    city: "London",
    area: "Shoreditch, London",
    date: relDate(5),
    time: "19:30",
    fee: 9,
    maxGuests: 20,
    vibes: "Lo-fi,Chill",
    description:
      "Sunset lo-fi on a Shoreditch rooftop. Vinyl + chill beats, blankets, and a great view. Bring a jumper — it gets cold up top.",
    hostName: "Jamie Thompson",
    hostIndex: 3,
    coverEmoji: "🌙",
    coverBg: "#1a1035",
    lat: 51.5258,
    lng: -0.0777,
    guestCount: 14,
    locationRevealHoursBefore: 6,
    menu: [
      { name: "Craft lager", price: 3, emoji: "🍺", category: "drink" },
      { name: "Olives bowl", price: 3, emoji: "🫒", category: "snack" },
      { name: "Soft drink", price: 2, emoji: "🥤", category: "soft" },
    ],
  },
  {
    id: "party_retro_manchester",
    title: "Maya's vinyl retro night",
    city: "Manchester",
    area: "Northern Quarter, Manchester",
    date: relDate(7),
    time: "20:00",
    fee: 5,
    maxGuests: 18,
    vibes: "Retro,EDM",
    description:
      "Spin the wax — 80s and 90s retro on actual vinyl. Northern Quarter studio space, proper sound system. Dress up if you want, no pressure.",
    hostName: "Maya Khan",
    hostIndex: 4,
    coverEmoji: "📼",
    coverBg: "#0d1f2d",
    lat: 53.4839,
    lng: -2.2333,
    guestCount: 6,
    locationRevealHoursBefore: 4,
    menu: [
      { name: "Gin & tonic", price: 4, emoji: "🍸", category: "drink" },
      { name: "Cheese board", price: 5, emoji: "🧀", category: "snack" },
      { name: "Soft drink", price: 2, emoji: "🥤", category: "soft" },
    ],
  },
  {
    id: "party_byob_delhi",
    title: "Kabir's BYOB terrace",
    city: "Delhi",
    area: "Hauz Khas, Delhi",
    date: relDate(4),
    time: "21:00",
    fee: 3,
    maxGuests: 16,
    vibes: "BYOB,Chill",
    description:
      "BYOB terrace session in Hauz Khas. Bring your own bottle, we'll handle the ice and mixers. Bollywood on low, deep house on high. Mumbai-style late night.",
    hostName: "Kabir Singh",
    hostIndex: 5,
    coverEmoji: "🍾",
    coverBg: "#1a1035",
    lat: 28.5494,
    lng: 77.2001,
    guestCount: 10,
    locationRevealHoursBefore: 3,
    menu: [
      { name: "Ice bucket", price: 1, emoji: "🧊", category: "soft" },
      { name: "Mixers set", price: 2, emoji: "🥤", category: "soft" },
      { name: "Chips bowl", price: 1, emoji: "🥨", category: "snack" },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding VibeMatch (UK + India, app-flow spec)...");

  // Wipe existing data (cascading where configured)
  await db.ticket.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.menuItem.deleteMany();
  await db.review.deleteMany();
  await db.partyView.deleteMany();
  await db.savedParty.deleteMany();
  await db.message.deleteMany();
  await db.chatThread.deleteMany();
  await db.joinRequest.deleteMany();
  await db.party.deleteMany();
  await db.user.deleteMany();
  console.log("  ✓ cleared existing data");

  // Users
  const users = [];
  for (const u of DEMO_USERS) {
    const created = await db.user.create({ data: u });
    users.push(created);
  }
  console.log(`  ✓ created ${users.length} users`);

  // Parties + menus
  for (const p of DEMO_PARTIES) {
    const host = users[p.hostIndex];
    const partyStart = new Date(`${p.date}T${p.time}:00`);
    const revealAt = new Date(
      partyStart.getTime() - (p.locationRevealHoursBefore ?? 3) * 3_600_000,
    );
    const party = await db.party.create({
      data: {
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
        hostId: host.id,
        coverUrl: null, // we render emoji covers in the UI
        lat: p.lat,
        lng: p.lng,
        guestCount: p.guestCount,
        approvalRequired: true,
        acceptJoiners: true,
        menuOpen: true,
        locationRevealAt: revealAt,
      },
    });

    // Menu items
    for (const m of p.menu) {
      await db.menuItem.create({
        data: {
          partyId: party.id,
          name: m.name,
          price: Math.round(m.price * 100) / 100,
          emoji: m.emoji,
          category: m.category,
        },
      });
    }
  }
  console.log(`  ✓ created ${DEMO_PARTIES.length} parties with menus`);

  // One demo chat thread (Jamie ↔ You) with a couple of messages
  const you = users[6];
  const jamie = users[3];
  const jamieParty = await db.party.findUnique({
    where: { id: "party_lofi_london" },
  });
  if (jamieParty) {
    const thread = await db.chatThread.create({
      data: {
        userAId: you.id,
        userBId: jamie.id,
        partyId: jamieParty.id,
      },
    });
    await db.message.create({
      data: {
        threadId: thread.id,
        senderId: jamie.id,
        receiverId: you.id,
        content: "Hey! Excited for the rooftop session 🎉",
      },
    });
    await db.message.create({
      data: {
        threadId: thread.id,
        senderId: you.id,
        receiverId: jamie.id,
        content: "Same! Bringing a friend if that's cool?",
        read: true,
      },
    });
    console.log("  ✓ seeded demo chat thread");
  }

  // A demo ticket for "You" on Aaditya's party — so the Tickets screen has data
  const aadityaParty = await db.party.findUnique({
    where: { id: "party_rnb_leith" },
  });
  if (aadityaParty) {
    const menuItems = await db.menuItem.findMany({
      where: { partyId: aadityaParty.id },
    });
    const jd = menuItems.find((m) => m.name.toLowerCase().includes("jack"));
    const nachos = menuItems.find((m) => m.name.toLowerCase().includes("nachos"));
    const order = await db.order.create({
      data: {
        userId: you.id,
        partyId: aadityaParty.id,
        totalAmount: 15, // £7 entry + £4 JD x2 + £4 nachos
        currency: "£",
        status: "paid",
        items: {
          create: [
            {
              name: "Entry ticket",
              emoji: "🎟️",
              unitPrice: 7,
              quantity: 1,
            },
            jd
              ? { menuItemId: jd.id, name: jd.name, emoji: jd.emoji, unitPrice: jd.price, quantity: 2 }
              : { name: "Jack Daniels shot", emoji: "🥃", unitPrice: 2, quantity: 2 },
            nachos
              ? { menuItemId: nachos.id, name: nachos.name, emoji: nachos.emoji, unitPrice: nachos.price, quantity: 1 }
              : { name: "Nachos plate", emoji: "🍟", unitPrice: 4, quantity: 1 },
          ],
        },
      },
      include: { items: true },
    });
    await db.ticket.create({
      data: {
        orderId: order.id,
        userId: you.id,
        partyId: aadityaParty.id,
        qrHash: `vm-${order.id.slice(-8).toUpperCase()}-${aadityaParty.id.slice(-4).toUpperCase()}`,
      },
    });
    console.log("  ✓ seeded demo order + ticket for 'You'");
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
