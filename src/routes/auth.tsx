import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Heart, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Conta criada. Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="glass relative w-full max-w-sm overflow-hidden rounded-3xl p-8 shadow-soft">
        <div className="absolute -right-4 -top-4 opacity-10">
            <Heart className="h-24 w-24 fill-accent" />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Heart className="h-10 w-10 fill-accent text-accent" />
          </motion.div>
          <h1 className="font-display text-3xl">Área restrita</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Entre para editar a história" : "Crie sua conta de admin"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-white/10 bg-white/5"
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-xl border-white/10 bg-white/5 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-accent cursor-pointer"
            >
              <AnimatePresence mode="wait">
                {showPassword ? (
                  <motion.div
                    key="eye-open"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="relative"
                  >
                    <Eye className="h-5 w-5" />
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -right-1 -top-1"
                    >
                        <Heart className="h-2 w-2 fill-accent text-accent" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="eye-closed"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <EyeOff className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl py-6 shadow-glow transition-all hover:scale-[1.02]">
            {loading ? "Aguarde..." : mode === "signin" ? "Entrar na história" : "Criar minha conta"}
          </Button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {mode === "signin" ? (
            <span>Não tem conta? <span className="text-accent underline">Crie uma agora</span></span>
          ) : (
            <span>Já tem conta? <span className="text-accent underline">Faça login</span></span>
          )}
        </button>
      </div>
    </main>
  );
}
