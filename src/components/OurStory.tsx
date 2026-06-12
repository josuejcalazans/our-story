import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, ArrowDown, Play, Lock, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  RELATIONSHIP_START as FALLBACK_START,
  HER_NAME as FALLBACK_NAME,
  STATS as FALLBACK_STATS,
  TIMELINE as FALLBACK_TIMELINE,
  PLACES,
  LOVE_LETTER as FALLBACK_LETTER,
  FINAL_MESSAGE as FALLBACK_FINAL,
} from "@/lib/love-data";
import {
  useTimeline,
  useStats,
  useSettings,
  useGallery,
  usePlaces,
  useMemoryEnvelopes,
  useLoveNotes,
} from "@/lib/use-site-content";
import { useRomanceMusic } from "@/hooks/use-romance-music";
import RomanceMusicPlayer from "@/components/story/RomanceMusicPlayer";
import MessageWall from "@/components/story/MessageWall";
import CinematicEnding from "@/components/story/CinematicEnding";
import ChapterNav from "@/components/story/ChapterNav";
import GalleryMasonry from "@/components/story/GalleryMasonry";
import LoveLetterEnvelope from "@/components/story/LoveLetterEnvelope";
import HeicSafeImage from "@/components/admin/HeicSafeImage";
import StoryVideoPlayer from "@/components/story/StoryVideoPlayer";
import { isHeicUrl } from "@/lib/prepare-upload-image";
import { isEmbeddableVideo } from "@/lib/video-embed";
import { StoryIcon } from "@/lib/story-icons";
import { StoryDateDisplay } from "@/components/StoryDate";
import { formatStoryDateTime } from "@/lib/story-date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/* ------------------------- Floating particles (seeded — organic look, stable on reload) ------------------------- */
function createSeededParticles(count: number) {
  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };

  return Array.from({ length: count }, (_, id) => ({
    id,
    size: rand() * 6 + 2,
    left: rand() * 100,
    top: rand() * 100,
    delay: rand() * 6,
    duration: 6 + rand() * 8,
  }));
}

const HERO_PARTICLES = createSeededParticles(30);

function Particles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {HERO_PARTICLES.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-secondary/40"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            filter: "blur(1px)",
            boxShadow: "0 0 12px var(--lavender)",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------- Easter Egg system ------------------------- */
type Unlock = "heart-taps" | "love-phrase" | "long-press";
const STORAGE_KEY = "our-story-unlocks";

function useUnlocks() {
  const [unlocks, setUnlocks] = useState<Record<Unlock, boolean>>({
    "heart-taps": false,
    "love-phrase": false,
    "long-press": false,
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUnlocks((u) => ({ ...u, ...JSON.parse(raw) }));
    } catch {}
  }, []);
  const unlock = (k: Unlock) =>
    setUnlocks((prev) => {
      if (prev[k]) return prev;
      const next = { ...prev, [k]: true };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { unlocks, unlock };
}

/* ------------------------- Hero with long-press easter egg ------------------------- */
function Hero({
  onStart,
  onLongPress,
  herName,
}: {
  onStart: () => void;
  onLongPress: () => void;
  herName: string;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  const handlePressStart = () => {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      onLongPress();
    }, 3000);
  };
  const cancel = () => {
    setPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <section
      id="chapter-hero"
      className="relative flex min-h-[100svh] scroll-mt-20 items-center justify-center overflow-hidden px-6"
    >
      <div className="absolute inset-0 bg-glow" />
      <Particles />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ scale: pressing ? [1, 1.3, 1.3] : [1, 1.15, 1] }}
          transition={{
            duration: pressing ? 3 : 2,
            repeat: pressing ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="mx-auto mb-6 inline-flex select-none touch-none cursor-pointer"
          onMouseDown={handlePressStart}
          onMouseUp={cancel}
          onMouseLeave={cancel}
          onTouchStart={handlePressStart}
          onTouchEnd={cancel}
          onTouchCancel={cancel}
        >
          <Heart className="h-12 w-12 fill-accent text-accent drop-shadow-[0_0_25px_var(--romance)]" />
        </motion.div>
        <h1 className="font-display text-5xl leading-tight tracking-tight text-glow sm:text-7xl md:text-8xl">
          Oi <span className="romantic-gradient-text italic">{herName}</span>{" "}
          <Heart
            aria-hidden
            className="inline-block h-[0.72em] w-[0.72em] shrink-0 fill-white text-white stroke-white drop-shadow-[0_0_16px_rgba(255,255,255,0.55)]"
            style={{ verticalAlign: "-0.08em" }}
          />
        </h1>
        <p className="mx-auto mt-6 max-w-md font-letter text-xl italic text-muted-foreground sm:text-2xl">
          Existe uma história que só nós dois conhecemos.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="group mt-12 inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:bg-primary/90 cursor-pointer sm:text-base"
        >
          Começar nossa jornada
          <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
        </motion.button>
      </motion.div>
    </section>
  );
}

/* ------------------------- Time together counter ------------------------- */
function useTimeTogether(startDate: Date) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = now.getTime() - startDate.getTime();
  return {
    days: Math.max(0, Math.floor(diff / 86400000)),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function TimeTogether({ startDate }: { startDate: Date }) {
  const t = useTimeTogether(startDate);
  const units = [
    { label: "dias", value: t.days },
    { label: "horas", value: t.hours },
    { label: "minutos", value: t.minutes },
    { label: "segundos", value: t.seconds },
  ];
  return (
    <SectionShell id="chapter-time">
      <SectionTitle eyebrow="Capítulo 01" title="Estamos juntos há" />
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {units.map((u) => (
          <div
            key={u.label}
            className="glass relative overflow-hidden rounded-2xl px-4 py-8 text-center shadow-soft"
          >
            <div className="font-display text-5xl text-glow sm:text-6xl">
              {u.value.toString().padStart(2, "0")}
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {u.label}
            </div>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-lg text-center font-letter text-lg italic text-muted-foreground">
        E cada segundo desses foi o melhor da minha vida.
      </p>
    </SectionShell>
  );
}

/* ------------------------- Stats ------------------------- */
function statDisplayValue(value: string, days: number) {
  return value === "dynamic-days" ? String(days) : value;
}

function isLongStatValue(value: string, days: number) {
  const text = statDisplayValue(value, days);
  return text.length > 6;
}

function StatsSection({
  stats,
  days,
}: {
  stats: { id?: string; icon: string; icon_name?: string | null; label: string; value: string }[];
  days: number;
}) {
  return (
    <SectionShell>
      <SectionTitle eyebrow="Capítulo 02" title="Nossa história em números" />
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => {
          const display = statDisplayValue(s.value, days);
          const longValue = isLongStatValue(s.value, days);
          return (
            <motion.div
              key={s.id ?? s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass group relative min-h-[9.5rem] overflow-hidden rounded-3xl p-5 shadow-soft sm:min-h-[10.5rem] sm:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 text-primary">
                  <StoryIcon
                    name={s.icon_name}
                    emoji={s.icon}
                    className="h-5 w-5"
                    filled={s.icon_name === "Heart"}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`font-display leading-tight romantic-gradient-text break-words ${
                      longValue
                        ? "text-xl sm:text-2xl"
                        : "text-3xl sm:text-4xl md:text-5xl"
                    }`}
                  >
                    {display}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}

/* ------------------------- Timeline ------------------------- */
function Timeline({
  items,
}: {
  items: {
    id?: string;
    date: string;
    title: string;
    description: string;
    place: string | null;
    image_url?: string;
    video_url?: string;
    icon_name?: string | null;
  }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SectionShell id="chapter-timeline">
      <SectionTitle eyebrow="Capítulo 03" title="Nossa História" />
      <div className="relative mt-16">
        <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-primary/0 via-primary/70 to-primary/0 sm:left-1/2" />
        <div className="space-y-10">
          {items.map((item, i) => {
            const isLeft = i % 2 === 0;
            const isOpen = open === i;
            return (
              <motion.div
                key={item.id ?? i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={`relative flex items-start gap-6 sm:gap-12 ${
                  isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                <div className="relative z-10 mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary shadow-glow ring-4 ring-background sm:absolute sm:left-1/2 sm:h-10 sm:w-10 sm:-translate-x-1/2">
                  <StoryIcon
                    name={item.icon_name}
                    className="h-4 w-4 text-white"
                    filled
                  />
                </div>
                <article
                  className={`group/timeline-card glass w-full overflow-hidden rounded-2xl transition-all hover:shadow-glow sm:w-[calc(50%-3rem)] ${
                    isLeft ? "sm:text-right" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full cursor-pointer text-left sm:text-inherit"
                  >
                    {item.image_url && (
                      <div className="flex max-h-[min(70vw,22rem)] w-full items-center justify-center overflow-hidden bg-black/20">
                        {isHeicUrl(item.image_url) ? (
                          <HeicSafeImage
                            src={item.image_url}
                            alt={item.title}
                            className="max-h-[min(70vw,22rem)] w-full object-contain transition-transform duration-500 group-hover/timeline-card:scale-[1.02]"
                          />
                        ) : (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="max-h-[min(70vw,22rem)] w-full object-contain transition-transform duration-500 group-hover/timeline-card:scale-[1.02]"
                          />
                        )}
                      </div>
                    )}
                    <div className="p-6">
                      <div className={isLeft ? "sm:flex sm:justify-end" : ""}>
                        <StoryDateDisplay
                          value={item.date}
                          align={isLeft ? "right" : "left"}
                          showWeekday
                        />
                      </div>
                      <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
                      {!isOpen && (
                        <p className="mt-2 text-sm text-muted-foreground/70">
                          {item.video_url ? "Toque para abrir e assistir" : "Toque para abrir"}
                        </p>
                      )}
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className={`space-y-4 px-6 pb-6 ${isLeft ? "sm:text-right" : ""}`}
                      >
                        <p className="font-letter text-lg italic leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                        {item.video_url && (
                          <div className="text-left">
                            <StoryVideoPlayer
                              url={item.video_url}
                              title={item.title}
                              clickToPlay
                            />
                          </div>
                        )}
                        {item.place && (
                          <p
                            className={`flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-accent ${
                              isLeft ? "sm:justify-end" : ""
                            }`}
                          >
                            <StoryIcon name="MapPin" className="h-3.5 w-3.5" />
                            {item.place}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------- Places ------------------------- */
function Places({
  items,
}: {
  items: { id?: string; icon: string; icon_name?: string | null; title: string; subtitle: string }[];
}) {
  return (
    <SectionShell>
      <SectionTitle eyebrow="Capítulo 04" title="Nossos lugares" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <motion.div
            key={p.id ?? p.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass group rounded-2xl p-6 transition-all hover:shadow-glow"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20 transition-colors group-hover:bg-accent/20">
              <StoryIcon name={p.icon_name} emoji={p.icon} className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-xl">{p.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------- Gallery ------------------------- */
function Gallery() {
  const { data: images, isLoading } = useGallery();
  const [mounted, setMounted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);

  const list = images ?? [];
  const active = lightboxIndex !== null ? list[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : (i + 1) % list.length));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i === null ? null : (i - 1 + list.length) % list.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, list.length]);

  if (isLoading || !mounted) return null;

  return (
    <SectionShell id="chapter-gallery">
      <SectionTitle eyebrow="Capítulo 05" title="Nossos momentos" />
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
        Passe o mouse e clique na moldura para ampliar.
      </p>
      <GalleryMasonry images={list} onOpen={setLightboxIndex} />
      {list.length === 0 && (
        <p className="text-center text-sm text-muted-foreground italic mt-10">
          Nenhuma foto adicionada ainda.
        </p>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-h-[100svh] max-w-[100vw] border-none bg-black/95 p-0 sm:max-w-6xl sm:rounded-2xl sm:border sm:border-white/10 sm:p-4">
          <DialogTitle className="sr-only">Foto ampliada</DialogTitle>
          <DialogDescription className="sr-only">
            {active?.title || active?.caption || "Visualização da galeria"}
          </DialogDescription>
          {active && (
            <div className="relative flex min-h-[60vh] flex-col">
              <img
                src={active.image_url}
                alt={active.title || active.caption || ""}
                className="max-h-[75vh] w-full flex-1 rounded-none object-contain sm:rounded-2xl"
              />
              <div className="space-y-2 p-4 text-center sm:p-2">
                {(active.title || active.caption) && (
                  <p className="font-display text-xl text-foreground sm:text-2xl">
                    {active.title || active.caption}
                  </p>
                )}
                {active.description && (
                  <p className="font-letter text-base italic text-muted-foreground sm:text-lg">
                    {active.description}
                  </p>
                )}
                {(active.location || active.taken_at) && (
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                    {[active.taken_at, active.location].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              {list.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={() =>
                      setLightboxIndex((i) =>
                        i === null ? null : (i - 1 + list.length) % list.length,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm cursor-pointer hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima foto"
                    onClick={() =>
                      setLightboxIndex((i) => (i === null ? null : (i + 1) % list.length))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm cursor-pointer hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

/* ------------------------- Video Message ------------------------- */
function VideoMessage({
  hiddenUnlocked,
  hiddenVideoUrl,
}: {
  hiddenUnlocked: boolean;
  hiddenVideoUrl: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <SectionShell id="video-section">
      <SectionTitle eyebrow="Capítulo 06" title="Uma mensagem pra você" />
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="glass relative aspect-video overflow-hidden rounded-3xl shadow-glow">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, var(--primary), transparent 60%), radial-gradient(circle at 70% 70%, var(--accent), transparent 60%), #160C28",
            }}
          />
          {!playing ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/30"
              >
                <Play className="ml-1 h-8 w-8 fill-white text-white" />
              </motion.span>
            </button>
          ) : hiddenUnlocked && hiddenVideoUrl && isEmbeddableVideo(hiddenVideoUrl) ? (
            <div className="absolute inset-0">
              <StoryVideoPlayer
                url={hiddenVideoUrl}
                title="Vídeo escondido"
                autoplay
                fill
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <Lock className="h-8 w-8 text-secondary" />
              <p className="mt-4 font-letter text-2xl italic">Conteúdo escondido</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Segure o coração no topo por 3 segundos para desbloquear.
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------- Memories with heart-tap easter egg ------------------------- */
function isMemoryUnlocked(e: { is_locked?: boolean; unlock_at?: string | null }) {
  if (!e.is_locked) return true;
  if (!e.unlock_at) return false;
  return new Date(e.unlock_at) <= new Date();
}

function Memories({
  envelopes,
  onHeartTaps,
}: {
  envelopes: {
    id: string;
    icon: string;
    icon_name?: string | null;
    title: string;
    message: string;
    is_easter_egg?: boolean;
    is_locked?: boolean;
    unlock_at?: string | null;
  }[];
  onHeartTaps: () => void;
}) {
  const cards = envelopes.filter((e) => !e.is_easter_egg);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [taps, setTaps] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tapHeart = () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    setTaps((t) => {
      const next = t + 1;
      if (next >= 5) {
        onHeartTaps();
        return 0;
      }
      return next;
    });
    tapTimer.current = setTimeout(() => setTaps(0), 1500);
  };

  return (
    <SectionShell id="chapter-memories">
      <SectionTitle eyebrow="Capítulo 08" title="Memórias Guardadas" />
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
        Algumas memórias desbloqueiam com o tempo. Toque nos envelopes abertos.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {cards.map((e) => {
          const unlocked = isMemoryUnlocked(e);
          const isOpen = open[e.id];
          return (
            <button
              type="button"
              key={e.id}
              disabled={!unlocked}
              onClick={() => unlocked && setOpen({ ...open, [e.id]: !isOpen })}
              className={`glass group relative overflow-hidden rounded-2xl p-6 text-left transition-all ${
                unlocked ? "hover:shadow-glow cursor-pointer" : "cursor-not-allowed opacity-70"
              }`}
            >
              <motion.div
                animate={{ rotateY: isOpen ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {!isOpen ? (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      {unlocked ? (
                        <StoryIcon name={e.icon_name} emoji={e.icon} className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-xl">{e.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {unlocked
                          ? "Toque para abrir"
                          : e.unlock_at
                            ? `Desbloqueia em ${formatStoryDateTime(new Date(e.unlock_at))}`
                            : "Ainda guardada"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ transform: "rotateY(180deg)" }}>
                    <p className="font-letter text-2xl italic leading-snug">{e.message}</p>
                  </div>
                )}
              </motion.div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3">
        <motion.button
          type="button"
          onClick={tapHeart}
          aria-label="Coração escondido — easter egg"
          animate={{
            boxShadow: [
              "0 0 0 0 oklch(0.74 0.21 350 / 0.25)",
              "0 0 0 12px oklch(0.74 0.21 350 / 0)",
            ],
          }}
          transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY }}
          className="group relative rounded-full border border-dashed border-accent/30 bg-accent/5 p-4 transition-all hover:border-accent/60 hover:bg-accent/10 cursor-pointer"
        >
          <Heart
            className={`h-7 w-7 transition-all ${
              taps > 0 ? "fill-accent text-accent scale-110" : "text-accent/70 group-hover:text-accent"
            }`}
          />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-glow">
            ?
          </span>
        </motion.button>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/70">
          <Sparkles className="h-3 w-3 text-accent/70" />
          Tem um segredo escondido aqui
          <Sparkles className="h-3 w-3 text-accent/70" />
        </p>
        {taps > 0 && taps < 5 && (
          <p className="text-xs text-accent/80">{5 - taps} toques restantes...</p>
        )}
      </div>
    </SectionShell>
  );
}

/* ------------------------- Final Surprise ------------------------- */
function FinalSurprise({
  finalMessage,
  onCinematic,
}: {
  finalMessage: string;
  onCinematic: () => void;
}) {
  return (
    <SectionShell id="chapter-final" className="text-center">
      <SectionTitle eyebrow="Capítulo final" title="Para sempre" />
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="mx-auto mt-10 max-w-2xl font-letter text-3xl italic leading-snug sm:text-4xl"
      >
        {finalMessage}
      </motion.p>
      <div className="relative mt-12 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={onCinematic}
          className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-base font-medium text-accent-foreground shadow-glow transition-all hover:bg-accent/90 cursor-pointer"
        >
          Uma última surpresa <Heart className="h-5 w-5 fill-white" />
        </motion.button>
      </div>
    </SectionShell>
  );
}

/* ------------------------- Secret modal ------------------------- */
function SecretModal({
  open,
  onClose,
  message,
  kind,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  message: string;
  kind: "secret" | "video";
  onAction?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative w-full max-w-lg overflow-hidden rounded-3xl p-8 text-center shadow-glow"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <Sparkles className="mx-auto h-10 w-10 text-secondary" />
            <h3 className="mt-4 font-display text-3xl romantic-gradient-text">
              {kind === "video" ? "Vídeo desbloqueado" : "Segredo desbloqueado"}
            </h3>
            <p className="mt-6 font-letter text-xl italic leading-relaxed">{message}</p>
            {kind === "video" && (
              <button
                type="button"
                onClick={() => {
                  onAction?.();
                  onClose();
                }}
                className="mt-4 text-xs text-muted-foreground hover:text-accent underline cursor-pointer transition-colors"
              >
                Toque aqui para ir ao capítulo 06 e assistir.
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------- Shared shells ------------------------- */
function SectionShell({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      className={`relative mx-auto w-full max-w-5xl scroll-mt-20 px-6 py-24 sm:py-32 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="text-center"
    >
      <div className="text-xs uppercase tracking-[0.35em] text-secondary">{eyebrow}</div>
      <h2 className="mt-3 font-display text-4xl text-glow sm:text-5xl md:text-6xl">
        <span className="romantic-gradient-text">{title}</span>
      </h2>
    </motion.div>
  );
}

/* ------------------------- Phrase listener (type "eu te amo") ------------------------- */
function usePhraseListener(target: string, onMatch: () => void) {
  useEffect(() => {
    let buffer = "";
    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-40);
        if (buffer.includes(target)) {
          onMatch();
          buffer = "";
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [target, onMatch]);
}

/* ------------------------- Page ------------------------- */
export default function OurStory() {
  const { data: timeline } = useTimeline();
  const { data: stats } = useStats();
  const { data: settings } = useSettings();
  const { data: places } = usePlaces();
  const { data: memoryEnvelopes } = useMemoryEnvelopes();
  const { data: loveNotes } = useLoveNotes();
  const music = useRomanceMusic(settings?.music_url);
  const { unlocks, unlock } = useUnlocks();
  const [modal, setModal] = useState<{ open: boolean; kind: "secret" | "video" }>({
    open: false,
    kind: "secret",
  });
  const [cinematicEnding, setCinematicEnding] = useState(false);

  const startDate = settings?.relationship_start
    ? new Date(settings.relationship_start)
    : FALLBACK_START;
  const herName = settings?.her_name || FALLBACK_NAME;
  const letter = settings?.love_letter || FALLBACK_LETTER;
  const finalMessage = settings?.final_message || FALLBACK_FINAL;
  const secretMessage =
    settings?.secret_message ||
    "Você encontrou um segredo. Eu te amo mais do que palavras conseguem dizer. ❤";

  const t = useTimeTogether(startDate);

  const timelineItems = (timeline ?? []).length
    ? (timeline ?? []).map((e) => ({
        id: e.id,
        date: e.date_text,
        title: e.title,
        description: e.description,
        place: e.place,
        image_url: e.image_url ?? undefined,
        video_url: e.video_url ?? undefined,
        icon_name: e.icon_name,
      }))
    : FALLBACK_TIMELINE.map((e, i) => ({
        id: String(i),
        date: e.date,
        title: e.title,
        description: e.description,
        place: e.place,
        icon_name: "Heart" as const,
      }));

  const statItems = (stats ?? []).length
    ? (stats ?? []).map((s) => ({
        id: s.id,
        icon: s.icon,
        icon_name: s.icon_name,
        label: s.label,
        value: s.value,
      }))
    : FALLBACK_STATS.map((s) => ({ ...s, icon_name: null }));

  const placeItems = (places ?? []).length
    ? (places ?? []).map((p) => ({
        id: p.id,
        icon: p.icon,
        icon_name: p.icon_name,
        title: p.title,
        subtitle: p.subtitle,
      }))
    : PLACES.map((p, i) => ({
        id: String(i),
        icon: p.emoji,
        icon_name: null,
        title: p.title,
        subtitle: p.subtitle,
      }));

  const envelopeItems = (memoryEnvelopes ?? []).length
    ? (memoryEnvelopes ?? []).map((e) => ({
        id: e.id,
        icon: e.icon,
        icon_name: e.icon_name,
        title: e.title,
        message: e.message,
        is_easter_egg: e.is_easter_egg,
        is_locked: e.is_locked,
        unlock_at: e.unlock_at,
      }))
    : [
        { id: "hard-days", icon: "💌", icon_name: "Mail", title: "Para os dias difíceis", message: "Respira. Eu tô aqui. Sempre.", is_easter_egg: false },
        { id: "dream-together", icon: "🌟", icon_name: "Star", title: "Para sonhar comigo", message: "Tem uma vida inteira nos esperando.", is_easter_egg: false },
        { id: "our-song", icon: "🎶", icon_name: "Music", title: "Nossa música", message: "Toca, fecha os olhos, e lembra de mim.", is_easter_egg: false },
        { id: "just-because", icon: "🌹", icon_name: "Flower2", title: "Só porque sim", message: "Você é a parte boa do meu dia.", is_easter_egg: false },
      ];

  usePhraseListener("eu te amo", () => {
    unlock("love-phrase");
    setModal({ open: true, kind: "secret" });
  });

  const start = () => {
    document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
  };
  const hiddenUnlocked = unlocks["long-press"];

  const themeClass =
    settings?.theme_mode === "soft-rose" ? "theme-soft-rose min-h-screen" : "min-h-screen";

  return (
    <main className={`relative ${themeClass}`}>
      <ChapterNav />
      <Hero
        herName={herName}
        onStart={start}
        onLongPress={() => {
          unlock("long-press");
          setModal({ open: true, kind: "video" });
        }}
      />
      <div id="story">
        <TimeTogether startDate={startDate} />
        <StatsSection stats={statItems} days={t.days} />
        <Timeline items={timelineItems} />
        <Places items={placeItems} />
        <Gallery />
        <VideoMessage
          hiddenUnlocked={hiddenUnlocked}
          hiddenVideoUrl={settings?.hidden_video_url ?? ""}
        />
        <MessageWall notes={loveNotes ?? []} />
        <SectionShell id="chapter-letter">
          <SectionTitle eyebrow="Capítulo 07" title="Uma carta para você" />
          <LoveLetterEnvelope letter={letter} />
        </SectionShell>
        <Memories
          envelopes={envelopeItems}
          onHeartTaps={() => {
            unlock("heart-taps");
            setModal({ open: true, kind: "secret" });
          }}
        />
        <FinalSurprise
          finalMessage={finalMessage}
          onCinematic={() => setCinematicEnding(true)}
        />
      </div>
      <RomanceMusicPlayer
        playing={music.playing}
        volume={music.volume}
        setVolume={music.setVolume}
        onToggle={music.toggle}
        hasMusic={music.hasMusic}
        loadError={music.loadError}
      />
      <CinematicEnding
        active={cinematicEnding}
        audioUrl={settings?.ending_audio_url}
        onRestart={() => {
          setCinematicEnding(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <footer className="px-6 py-10 text-center text-xs text-muted-foreground/60">
        <p>
          Feito com <Heart className="inline h-3 w-3 fill-accent text-accent" /> só para você.
        </p>
        <Link
          to="/auth"
          className="mt-2 inline-block text-[9px] tracking-[0.2em] text-muted-foreground/25 uppercase transition-colors hover:text-muted-foreground/45"
        >
          entrar
        </Link>
      </footer>
      <SecretModal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        onAction={() => {
          document.getElementById("video-section")?.scrollIntoView({ behavior: "smooth" });
        }}
        message={modal.kind === "video" ? "Você desbloqueou o vídeo escondido." : secretMessage}
        kind={modal.kind}
      />
    </main>
  );
}
