import { experiences } from "@/content/music";
import { story, type Row } from "@/content/story";

// Everything the story needs later (every record's songs, the fireworks song and
// sound, the character art and the 3D world's code) is downloaded up front, behind
// the loading screen, so nothing streams in mid-scene. Downloads are held as blobs
// in memory and served from blob: URLs, so playback never goes back to the network.

const urls = new Map<string, string>(); // original path → blob: URL

const plain = (src: string) => src.split("#")[0];

/** The in-memory copy of an asset if it was preloaded, else the original path. */
export function resolve(src: string) {
  return urls.get(plain(src)) ?? plain(src);
}

function manifest() {
  const audio = new Set<string>(["/audio/fireworks-distant.mp3"]);
  for (const r of experiences) for (const t of Object.values(r.tracks)) if (t) audio.add(plain(t));
  const images = new Set<string>(["/characters/finale-cutout.webp"]);
  const rows: Row[] = [...story.opening, ...story.gratitude, ...story.imagine];
  for (const row of rows) for (const beat of "row" in row ? row.row : [row]) if (beat.cast) images.add(`/characters/${beat.cast}.png`);
  return [...audio, ...images];
}

/** Downloads one file, reporting bytes as they arrive. Failures fall back to the network later. */
async function fetchOne(path: string, onBytes: (loaded: number, total: number) => void) {
  try {
    const res = await fetch(path);
    if (!res.ok || !res.body) throw new Error(String(res.status));
    const total = Number(res.headers.get("content-length")) || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onBytes(loaded, Math.max(total, loaded));
    }
    const type = res.headers.get("content-type") ?? "";
    const url = URL.createObjectURL(new Blob(chunks as BlobPart[], { type }));
    urls.set(path, url);
    if (type.startsWith("image/")) {
      // decode now so the first frame they appear in doesn't stall
      const img = new Image();
      img.src = url;
      await img.decode().catch(() => {});
    }
  } catch {
    onBytes(1, 1);
  }
}

let started: Promise<void> | null = null;
const listeners = new Set<(p: number) => void>();
const loaded = new Map<string, [number, number]>();

/** Starts (once) and resolves when everything is ready; progress is 0..1. */
export function preloadAll(onProgress: (p: number) => void): Promise<void> {
  const files = manifest();
  listeners.add(onProgress);
  // until a file's size is known, assume a typical song so the bar doesn't jump back
  const report = () => {
    let a = 0;
    let b = 0;
    for (const f of files) {
      const [l, t] = loaded.get(f) ?? [0, f.startsWith("/audio/") ? 5e6 : 2e5];
      a += l;
      b += t;
    }
    for (const l of listeners) l(b ? a / b : 1);
  };
  started ??= Promise.all([
    ...files.map((f) =>
      fetchOne(f, (l, t) => {
        loaded.set(f, [l, t]);
        report();
      })
    ),
    import("@/components/World").catch(() => {}),
    document.fonts?.ready,
  ]).then(() => {
    for (const l of listeners) l(1);
  });
  return started;
}
