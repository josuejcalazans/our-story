import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Volume2 } from "lucide-react";
import { fadeOutHeartbeatAudioSession } from "@/lib/heartbeat-audio-session";
import { playRomanceMusicWithCrossfade } from "@/lib/romance-music-session";

export default function StoryWelcomeScreen({
  herName,
  musicUrl,
  onReady,
}: {
  herName?: string;
  musicUrl?: string | null;
  onReady: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReady() {
    if (loading) return;
    setLoading(true);
    const crossfadeMs = 2200;
    await Promise.all([
      fadeOutHeartbeatAudioSession(crossfadeMs),
      playRomanceMusicWithCrossfade(musicUrl, crossfadeMs),
    ]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    onReady();
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background">
      <div className="absolute inset-0 bg-glow" />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30 shadow-glow"
        >
          <Heart className="h-10 w-10 fill-accent text-accent" aria-hidden />
        </motion.div>

        <h1 className="font-display text-4xl text-glow sm:text-5xl">
          <span className="romantic-gradient-text">
            Bem-vinda{herName ? `, ${herName}` : ""}.
          </span>
        </h1>

        <p className="mt-6 max-w-sm font-letter text-xl italic leading-relaxed text-muted-foreground sm:text-2xl">
          Antes de começar...
          <br />
          coloque o som.
          <Heart
            aria-hidden
            className="ml-1.5 inline-block h-[0.85em] w-[0.85em] fill-accent text-accent drop-shadow-[0_0_16px_rgba(236,72,153,0.5)]"
            style={{ verticalAlign: "-0.08em" }}
          />
        </p>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          onClick={() => void handleReady()}
          className="mt-12 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-4 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:bg-primary/90 disabled:opacity-70 cursor-pointer sm:text-base"
        >
          <Volume2 className="h-4 w-4" />
          {loading ? "Abrindo nossa história..." : "Estou pronta"}
        </motion.button>
      </motion.div>
    </div>
  );
}
