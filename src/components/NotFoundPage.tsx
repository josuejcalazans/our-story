import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FLOATING_HEARTS = [
  { id: 1, left: 12, top: 18, size: 14, delay: 0, duration: 7 },
  { id: 2, left: 78, top: 12, size: 10, delay: 1.2, duration: 9 },
  { id: 3, left: 88, top: 62, size: 12, delay: 0.6, duration: 8 },
  { id: 4, left: 8, top: 72, size: 11, delay: 2, duration: 10 },
  { id: 5, left: 52, top: 8, size: 9, delay: 1.8, duration: 11 },
  { id: 6, left: 34, top: 84, size: 13, delay: 0.3, duration: 8.5 },
] as const;

const PARTICLES = [
  { id: 1, left: 22, top: 40, size: 4, delay: 0, duration: 6 },
  { id: 2, left: 65, top: 28, size: 3, delay: 1.5, duration: 7 },
  { id: 3, left: 44, top: 55, size: 5, delay: 0.8, duration: 9 },
  { id: 4, left: 91, top: 38, size: 3, delay: 2.2, duration: 8 },
  { id: 5, left: 6, top: 48, size: 4, delay: 1, duration: 10 },
] as const;

function FloatingAmbience() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-secondary/35"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            filter: "blur(1px)",
            boxShadow: "0 0 10px var(--lavender)",
          }}
        />
      ))}
      {FLOATING_HEARTS.map((h) => (
        <Heart
          key={h.id}
          className="absolute text-accent/25"
          style={{
            width: h.size,
            height: h.size,
            left: `${h.left}%`,
            top: `${h.top}%`,
            animation: `float ${h.duration}s ease-in-out ${h.delay}s infinite`,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-glow" />
      <FloatingAmbience />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Capítulo perdido
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-5">
          <span className="font-display text-7xl leading-none text-glow sm:text-8xl">4</span>
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30 shadow-glow sm:h-20 sm:w-20"
          >
            <Heart className="h-8 w-8 fill-accent text-accent sm:h-10 sm:w-10" aria-hidden />
            <motion.span
              className="absolute inset-0 rounded-full ring-2 ring-accent/20"
              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
            />
          </motion.div>
          <span className="font-display text-7xl leading-none text-glow sm:text-8xl">4</span>
        </div>

        <div className="glass mx-auto mt-10 rounded-3xl p-8 shadow-soft sm:p-10">
          <h1 className="font-display text-2xl leading-snug sm:text-3xl">
            <span className="romantic-gradient-text">Este caminho ainda não existe</span>
          </h1>
          <p className="mt-4 font-letter text-lg italic leading-relaxed text-muted-foreground sm:text-xl">
            Talvez seja um capítulo que ainda vamos escrever juntos — ou só um desvio no caminho de
            volta para nós.
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
            <Sparkles className="h-3 w-3 text-accent/70" />
            Erro 404 · página não encontrada
            <Sparkles className="h-3 w-3 text-accent/70" />
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8"
        >
          <Button
            asChild
            size="lg"
            className="group rounded-full px-8 py-6 text-sm shadow-glow transition-all hover:scale-[1.02] sm:text-base"
          >
            <Link to="/">
              <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
              Voltar para nossa história
              <Heart className="fill-current transition-transform group-hover:scale-110" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
}
