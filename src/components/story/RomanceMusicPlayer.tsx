import { motion, AnimatePresence } from "framer-motion";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useRomanceMusic } from "@/hooks/use-romance-music";

export function RomanceMusicProvider({
  musicUrl,
  children,
  onUnlockPlay,
}: {
  musicUrl?: string | null;
  children: (api: ReturnType<typeof useRomanceMusic>) => React.ReactNode;
  onUnlockPlay?: () => void;
}) {
  const api = useRomanceMusic(musicUrl);
  return <>{children(api)}</>;
}

export default function RomanceMusicPlayer({
  playing,
  volume,
  setVolume,
  onToggle,
  hasMusic,
  loadError,
}: {
  playing: boolean;
  volume: number;
  setVolume: (v: number) => void;
  onToggle: () => void;
  hasMusic: boolean;
  loadError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!hasMusic) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="glass mb-3 w-56 rounded-2xl border border-white/10 p-4 shadow-glow"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Volume</p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
              aria-label="Volume da música"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/80 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground cursor-pointer"
          aria-label="Ajustar volume"
        >
          {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => void onToggle()}
          className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-4 py-2.5 text-xs font-medium text-accent shadow-glow backdrop-blur-md transition-all hover:bg-accent/25 cursor-pointer"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          Nossa Música
          <Music className="h-3.5 w-3.5 opacity-70" />
        </button>
      </div>
      {loadError && (
        <p className="mt-2 max-w-[12rem] text-right text-[10px] text-destructive/80">
          Não foi possível tocar. Verifique a URL do áudio.
        </p>
      )}
    </div>
  );
}
