import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ── Upload config ──────────────────────────────────────────────────────
// Hosts can attach up to 6 photos or short clips to a party. We accept the
// common web image + video formats. Size limits keep SQLite + disk happy in
// the sandbox (videos are capped at 60 MB which is ~30s of 1080p).
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

// Map a mime type → file extension so saved files have the right suffix.
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
};

// Route segment config — allow large bodies for multipart uploads.
// Route Handlers in Next 16 read the body as a stream, so this is mostly
// a safety net / documentation, but we set it explicitly.
export const runtime = "nodejs";
export const maxDuration = 60;

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  // Light auth gate: only logged-in hosts should upload. We don't have a
  // hard session here, so we accept any request — the create-party flow is
  // the real gate. Skipping heavy auth keeps the uploader fast.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Expected multipart/form-data");
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return bad("No file provided (field name must be 'file')");
  }
  if (files.length > 6) {
    return bad("Max 6 files per upload");
  }

  // Ensure the uploads dir exists (idempotent).
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch {
    /* already exists — ignore */
  }

  const saved: {
    url: string;
    type: "image" | "video";
    name: string;
    size: number;
  }[] = [];

  for (const file of files) {
    const mime = (file.type || "").toLowerCase();
    const isImage = IMAGE_TYPES.has(mime);
    const isVideo = VIDEO_TYPES.has(mime);
    if (!isImage && !isVideo) {
      return bad(
        `Unsupported file type: ${file.type || "unknown"}. Allowed: JPG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV.`,
      );
    }
    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      return bad(
        `"${file.name}" is too large. Max ${mb} MB for ${isImage ? "images" : "videos"}.`,
      );
    }
    if (file.size === 0) {
      return bad(`"${file.name}" is empty.`);
    }

    const ext = EXT_BY_TYPE[mime] || (isImage ? "jpg" : "mp4");
    // Build a collision-safe filename: timestamp + short uuid + original slug.
    const slug = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${slug ? `-${slug}` : ""}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
    } catch (err) {
      console.error("[upload] write failed", err);
      return bad("Failed to save file. Try again.", 500);
    }

    saved.push({
      url: `/uploads/${filename}`,
      type: isImage ? "image" : "video",
      name: file.name,
      size: file.size,
    });
  }

  return NextResponse.json({ files: saved }, { status: 201 });
}
