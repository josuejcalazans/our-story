import { setPlaybackAudioSession } from "@/lib/heartbeat-audio-unlock";

let audio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let volume = 0.65;

function normalizeUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}

function ensureAudio() {
  if (typeof document === "undefined") return null;
  if (!audio) {
    audio = document.createElement("audio");
    audio.loop = true;
    audio.volume = volume;
    audio.playsInline = true;
    audio.preload = "auto";
    audio.className = "hidden";
    audio.setAttribute("aria-hidden", "true");
    document.body.appendChild(audio);
  }
  return audio;
}

async function waitForReady(el: HTMLAudioElement) {
  if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;
  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("load failed"));
    };
    const cleanup = () => {
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onError);
    };
    el.addEventListener("canplay", onReady, { once: true });
    el.addEventListener("error", onError, { once: true });
    el.load();
  });
}

export function getRomanceMusicElement() {
  return ensureAudio();
}

export function getRomanceMusicVolume() {
  return volume;
}

export function setRomanceMusicVolume(next: number) {
  volume = next;
  if (audio) audio.volume = next;
}

export function hasRomanceMusicUrl(url: string | null | undefined) {
  return Boolean(normalizeUrl(url));
}

export async function playRomanceMusic(url: string | null | undefined): Promise<boolean> {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;

  const el = ensureAudio();
  if (!el) return false;

  setPlaybackAudioSession();

  try {
    const resolved = new URL(normalized, window.location.href).href;
    if (currentUrl !== normalized || el.src !== resolved) {
      el.src = normalized;
      currentUrl = normalized;
    }
    await waitForReady(el);
    await el.play();
    return true;
  } catch (err) {
    console.warn("[romance-music] play failed:", err);
    return false;
  }
}

export function pauseRomanceMusic() {
  audio?.pause();
}

export function toggleRomanceMusic(url: string | null | undefined): Promise<boolean> {
  const el = ensureAudio();
  if (!el || !normalizeUrl(url)) return Promise.resolve(false);
  if (el.paused) return playRomanceMusic(url);
  el.pause();
  return Promise.resolve(true);
}

export function isRomanceMusicPlaying() {
  return Boolean(audio && !audio.paused);
}
