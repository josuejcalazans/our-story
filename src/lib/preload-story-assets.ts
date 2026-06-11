import { preloadEndingSurpriseAudio } from "@/lib/ending-audio-session";
import { preloadRomanceMusic } from "@/lib/romance-music-session";
import { loadHeartbeatSample } from "@/lib/heartbeat-sample";
import { createAudioContext } from "@/lib/heartbeat-sound";

const HEARTBEAT_MP3 = "/audio/heartbeat.mp3";

function preloadUrl(href: string, as: "audio" | "image" | "fetch") {
  if (typeof document === "undefined") return;
  const exists = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (exists) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = href;
  if (as === "fetch") link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

export async function preloadStoryAssets(opts: {
  musicUrl?: string | null;
  endingAudioUrl?: string | null;
  galleryImageUrls?: string[];
}) {
  if (typeof window === "undefined") return;

  preloadUrl(HEARTBEAT_MP3, "audio");
  void preloadRomanceMusic(opts.musicUrl);
  preloadEndingSurpriseAudio(opts.endingAudioUrl);

  try {
    const ctx = createAudioContext();
    void loadHeartbeatSample(ctx);
    if (ctx.state !== "closed") void ctx.close();
  } catch {
    /* sample opcional */
  }

  for (const url of (opts.galleryImageUrls ?? []).slice(0, 3)) {
    if (!url?.trim()) continue;
    preloadUrl(url, "image");
  }
}
