import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/use-site-content";
import {
  checkGatePassword,
  isGateUnlocked,
  unlockGate,
} from "@/lib/page-gate";

export default function PageGate({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = useSettings();
  const [unlocked, setUnlocked] = useState(isGateUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Heart className="h-8 w-8 animate-pulse fill-accent text-accent" />
      </div>
    );
  }

  const gateEnabled = settings?.page_gate_enabled ?? false;
  const accessDate = settings?.access_date ?? settings?.relationship_start?.slice(0, 10);

  if (!gateEnabled || unlocked) {
    return <>{children}</>;
  }

  if (!accessDate) {
    return <>{children}</>;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (checkGatePassword(password, accessDate!)) {
      unlockGate();
      setUnlocked(true);
      setError(false);
      return;
    }
    setError(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-glow" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8 text-center shadow-glow"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl text-glow">Só para nós</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Digite a data especial no formato{" "}
          <span className="font-mono text-foreground">DDMMYYYY</span>
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Input
            inputMode="numeric"
            placeholder="ex: 01052023"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className="h-12 rounded-xl border-white/10 bg-white/5 text-center font-mono text-lg tracking-widest"
          />
          {error && (
            <p className="text-xs text-destructive">Data incorreta. Tente de novo com carinho.</p>
          )}
          <Button type="submit" className="w-full rounded-xl py-6 shadow-glow">
            Entrar na história
          </Button>
        </form>
        <p className="mt-6 text-[10px] text-muted-foreground/50">
          Só quem conhece a nossa data especial consegue entrar.
        </p>
      </motion.div>
    </div>
  );
}
