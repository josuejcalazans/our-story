import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { unlockHeartbeatAudio } from "@/lib/heartbeat-audio-session";

export default function StoryPreparingScreen({ onReady }: { onReady: () => void }) {
  const [starting, setStarting] = useState(false);

  const handleStart = () => {
    if (starting) return;
    setStarting(true);
    void unlockHeartbeatAudio().finally(() => onReady());
  };

  return (
    <button
      type="button"
      onPointerDown={handleStart}
      disabled={starting}
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-background touch-manipulation cursor-pointer border-0 p-0 text-left"
      aria-label="Toque para continuar"
    >
      <div className="absolute inset-0 bg-glow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 px-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30 shadow-glow"
        >
          <Heart className="h-8 w-8 fill-accent text-accent" aria-hidden />
        </motion.div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Um momento
          </p>
          <h1 className="font-display text-2xl leading-snug sm:text-3xl">
            <span className="romantic-gradient-text">Preparando nossa história</span>
          </h1>
          <p className="font-letter text-base italic text-muted-foreground sm:text-lg">
            Algo especial está sendo guardado só para você...
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 via-primary to-accent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              style={{ width: "45%" }}
            />
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
            <Sparkles className="h-3 w-3 text-accent/70" />
            {starting ? "Abrindo..." : "Toque para continuar"}
            <Sparkles className="h-3 w-3 text-accent/70" />
          </p>
        </div>
      </motion.div>
    </button>
  );
}
