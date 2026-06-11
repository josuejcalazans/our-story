/** WAV silencioso — só para abrir sessão de áudio no iOS (para logo após unlock) */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let silentAudio: HTMLAudioElement | null = null;

export function setPlaybackAudioSession() {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = "playback";
}

/** Tenta iniciar <audio> silencioso — para assim que desbloquear */
export async function primeSilentAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (!silentAudio) {
      silentAudio = new Audio(SILENT_WAV);
      silentAudio.loop = false;
      silentAudio.volume = 0.001;
      silentAudio.setAttribute("playsinline", "");
      silentAudio.preload = "auto";
    }
    silentAudio.currentTime = 0;
    await silentAudio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopSilentAudio() {
  if (!silentAudio) return;
  silentAudio.pause();
  silentAudio.currentTime = 0;
}
