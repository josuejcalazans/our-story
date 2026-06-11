import { setPlaybackAudioSession } from "@/lib/heartbeat-audio-unlock";
import {
  getRomanceMusicElement,
  getRomanceMusicVolume,
  isRomanceMusicPlaying,
  setRomanceMusicVolume,
} from "@/lib/romance-music-session";

let audio: HTMLAudioElement | null = null;
let romanceWasPlaying = false;
let romanceVolumeBefore = 0.65;
let fadeRaf = 0;

function normalizeUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}

function ensureAudio() {
  if (typeof document === "undefined") return null;
  if (!audio) {
    audio = document.createElement("audio");
    audio.preload = "auto";
    audio.playsInline = true;
    audio.className = "hidden";
    audio.setAttribute("aria-hidden", "true");
    document.body.appendChild(audio);
  }
  return audio;
}

function cancelFade() {
  if (fadeRaf) cancelAnimationFrame(fadeRaf);
  fadeRaf = 0;
}

function fadeElementVolume(el: HTMLAudioElement, from: number, to: number, durationMs: number) {
  cancelFade();
  const start = performance.now();

  return new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t * t * (3 - 2 * t);
      el.volume = from + (to - from) * eased;
      if (t < 1) {
        fadeRaf = requestAnimationFrame(tick);
      } else {
        fadeRaf = 0;
        resolve();
      }
    };
    fadeRaf = requestAnimationFrame(tick);
  });
}

async function duckRomanceMusic(fadeMs = 1200) {
  const romance = getRomanceMusicElement();
  if (!romance || romance.paused) return;

  romanceWasPlaying = true;
  romanceVolumeBefore = getRomanceMusicVolume();
  const from = romance.volume;
  await fadeElementVolume(romance, from, 0.08, fadeMs);
}

async function restoreRomanceMusic(fadeMs = 1000) {
  if (!romanceWasPlaying) return;
  const romance = getRomanceMusicElement();
  if (!romance || romance.paused) {
    romanceWasPlaying = false;
    return;
  }

  const target = romanceVolumeBefore || getRomanceMusicVolume();
  setRomanceMusicVolume(target);
  await fadeElementVolume(romance, romance.volume, target, fadeMs);
  romanceWasPlaying = false;
}

export async function playEndingSurpriseAudio(
  url: string | null | undefined,
  fadeMs = 1400,
): Promise<boolean> {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;

  const el = ensureAudio();
  if (!el) return false;

  setPlaybackAudioSession();

  try {
    if (isRomanceMusicPlaying()) void duckRomanceMusic(fadeMs);

    const resolved = new URL(normalized, window.location.href).href;
    if (el.src !== resolved) {
      el.src = normalized;
      el.load();
    }

    el.loop = false;
    el.volume = 0;
    await el.play();
    await fadeElementVolume(el, 0, 1, fadeMs);
    return true;
  } catch (err) {
    console.warn("[ending-audio] play failed:", err);
    return false;
  }
}

export function stopEndingSurpriseAudio() {
  cancelFade();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  void restoreRomanceMusic();
}

export function preloadEndingSurpriseAudio(url: string | null | undefined) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;
  const el = ensureAudio();
  if (!el) return;
  const resolved = new URL(normalized, window.location.href).href;
  if (el.src !== resolved) {
    el.src = normalized;
    el.load();
  }
}
