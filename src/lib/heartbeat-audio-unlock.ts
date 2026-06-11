export function setPlaybackAudioSession() {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = "playback";
}

export function resetPlaybackAudioSession() {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = "auto";
}
