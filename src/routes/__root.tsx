import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import NotFoundPage from "@/components/NotFoundPage";

function NotFoundComponent() {
  return <NotFoundPage />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-glow" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Um instante interrompido
        </p>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="relative mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30 shadow-glow"
        >
          <Heart className="h-10 w-10 fill-accent text-accent" aria-hidden />
          <motion.span
            className="absolute inset-0 rounded-full ring-2 ring-accent/20"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
          />
        </motion.div>

        <div className="glass mx-auto mt-10 rounded-3xl p-8 shadow-soft sm:p-10">
          <h1 className="font-display text-2xl leading-snug sm:text-3xl">
            <span className="romantic-gradient-text">Algo pausou nossa história</span>
          </h1>
          <p className="mt-4 font-letter text-lg italic leading-relaxed text-muted-foreground sm:text-xl">
            Nem todo capítulo carrega de primeira — às vezes o coração precisa de um segundo
            batimento para continuar.
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
            <Sparkles className="h-3 w-3 text-accent/70" />
            Erro inesperado · volte quando quiser
            <Sparkles className="h-3 w-3 text-accent/70" />
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Button
            type="button"
            size="lg"
            className="rounded-full px-8 shadow-glow"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar de novo
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-accent/25 px-8"
          >
            <Link to="/">
              Voltar para nós
              <Heart className="fill-current" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nossa História ❤️" },
      { name: "description", content: "Uma jornada íntima através do nosso amor — capítulo por capítulo." },
      { name: "theme-color", content: "#0D0717" },
      { property: "og:title", content: "Nossa História ❤️" },
      { property: "og:description", content: "Preparei algo especial só para você, meu amor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
