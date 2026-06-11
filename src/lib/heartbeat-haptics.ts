import { LUB_DUB_GAP_MS } from "@/lib/heartbeat-loader-timing";

export function pulseHeartbeatHaptic(phase: "lub" | "dub" = "lub") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  try {
    if (phase === "lub") {
      navigator.vibrate(32);
      window.setTimeout(() => {
        try {
          navigator.vibrate(14);
        } catch {
          /* ignore */
        }
      }, LUB_DUB_GAP_MS);
    } else {
      navigator.vibrate(14);
    }
  } catch {
    /* iOS / permissão negada */
  }
}
