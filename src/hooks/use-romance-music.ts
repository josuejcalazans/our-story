import { useCallback, useEffect, useState } from "react";
import {
  getRomanceMusicElement,
  getRomanceMusicVolume,
  hasRomanceMusicUrl,
  pauseRomanceMusic,
  playRomanceMusic,
  setRomanceMusicVolume,
  toggleRomanceMusic,
} from "@/lib/romance-music-session";

function normalizeMusicUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}

export function useRomanceMusic(musicUrl: string | null | undefined) {
  const normalizedUrl = normalizeMusicUrl(musicUrl);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(getRomanceMusicVolume);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const audio = getRomanceMusicElement();
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setLoadError(true);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    setPlaying(!audio.paused);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [normalizedUrl]);

  useEffect(() => {
    const audio = getRomanceMusicElement();
    if (!audio || !normalizedUrl) return;

    setLoadError(false);
    const resolved = new URL(normalizedUrl, window.location.href).href;
    if (audio.src !== resolved) {
      audio.src = normalizedUrl;
      audio.load();
    }
  }, [normalizedUrl]);

  const setVolume = useCallback((next: number) => {
    setVolumeState(next);
    setRomanceMusicVolume(next);
  }, []);

  const unlockAndPlay = useCallback(async () => {
    if (!normalizedUrl) return false;
    const ok = await playRomanceMusic(normalizedUrl);
    setLoadError(!ok);
    return ok;
  }, [normalizedUrl]);

  const toggle = useCallback(async () => {
    if (!normalizedUrl) return;
    const ok = await toggleRomanceMusic(normalizedUrl);
    if (!ok) setLoadError(true);
  }, [normalizedUrl]);

  const pause = useCallback(() => {
    pauseRomanceMusic();
    setPlaying(false);
  }, []);

  return {
    playing,
    volume,
    setVolume,
    unlockAndPlay,
    toggle,
    pause,
    hasMusic: hasRomanceMusicUrl(normalizedUrl),
    loadError,
  };
}
