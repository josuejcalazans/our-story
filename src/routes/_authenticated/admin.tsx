import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, LogOut, Heart, Save, Loader2, Upload, X, Eye, Palette, QrCode } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import {
  useTimeline,
  useStats,
  useSettings,
  type TimelineEvent,
  type Stat,
  type SiteSettings,
} from "@/lib/use-site-content";
import { useQueryClient } from "@tanstack/react-query";
import OurStory from "@/components/OurStory";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [grantingSelf, setGrantingSelf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function grantSelfAdmin() {
    if (!session) return;
    setGrantingSelf(true);
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      toast.error("Já existe um admin. Peça acesso a quem já é admin.");
      setGrantingSelf(false);
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: session.user.id, role: "admin" });
    if (error) toast.error(error.message);
    else {
      toast.success("Você agora é admin. Recarregando...");
      setTimeout(() => window.location.reload(), 600);
    }
    setGrantingSelf(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <Heart className="mx-auto h-8 w-8 fill-accent text-accent" />
          <h1 className="mt-4 font-display text-2xl">Sem permissão de admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conectado como <strong>{session?.user.email}</strong>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Se você é o primeiro admin, clique abaixo para se tornar administrador.
          </p>
          <Button onClick={grantSelfAdmin} disabled={grantingSelf} className="mt-4 w-full">
            {grantingSelf ? "Concedendo..." : "Tornar-me admin"}
          </Button>
          <Button onClick={signOut} variant="ghost" className="mt-2 w-full">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">Painel do Coração</h1>
            <p className="text-sm text-muted-foreground">{session?.user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(true)} variant="secondary" className="gap-2 rounded-xl">
                <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button onClick={signOut} variant="outline" className="gap-2 rounded-xl">
                <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-white/5 p-1">
            <TabsTrigger value="timeline" className="rounded-lg">Timeline</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg">Estatísticas</TabsTrigger>
            <TabsTrigger value="letter" className="rounded-lg">Configurações</TabsTrigger>
            <TabsTrigger value="share" className="rounded-lg">Compartilhar</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-6">
            <TimelineEditor />
          </TabsContent>
          <TabsContent value="stats" className="mt-6">
            <StatsEditor />
          </TabsContent>
          <TabsContent value="letter" className="mt-6">
            <SettingsEditor />
          </TabsContent>
          <TabsContent value="share" className="mt-6">
            <SharePanel />
          </TabsContent>
        </Tabs>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-background"
          >
            <div className="absolute right-6 top-6 z-[110]">
              <Button 
                onClick={() => setShowPreview(false)} 
                variant="destructive" 
                size="icon" 
                className="rounded-full shadow-glow cursor-pointer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              <OurStory />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* -------------------- Share Panel -------------------- */
function SharePanel() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div className="glass flex flex-col items-center gap-6 rounded-2xl p-8 text-center">
      <div className="rounded-2xl bg-white p-4 shadow-glow">
        <img src={qrUrl} alt="QR Code" className="h-48 w-48" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-2xl">Sua História está Pronta!</h3>
        <p className="text-sm text-muted-foreground">
          Aponte a câmera do celular para o QR Code para abrir.
        </p>
      </div>
      <div className="flex w-full max-w-sm items-center gap-2 rounded-xl bg-white/5 p-2">
        <Input value={url} readOnly className="border-none bg-transparent" />
        <Button size="sm" onClick={() => {
            navigator.clipboard.writeText(url);
            toast.success("Link copiado!");
        }} className="rounded-lg">Copiar</Button>
      </div>
    </div>
  );
}

/* -------------------- Media Upload Component -------------------- */
function MediaUpload({ onUpload, currentUrl, type = "image" }: { 
    onUpload: (url: string) => void; 
    currentUrl?: string | null;
    type?: "image" | "video" 
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
      onUpload(data.publicUrl);
      toast.success("Upload concluído!");
    } catch (err) {
      toast.error("Erro no upload");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {currentUrl && (
        <div className="relative inline-block">
          {type === "image" ? (
            <img src={currentUrl} alt="Preview" className="h-20 w-32 rounded-lg object-cover shadow-soft" />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-white/10 text-xs border border-white/5">Vídeo</div>
          )}
          <button 
            onClick={() => onUpload("")}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-md cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10 border border-white/5">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{uploading ? "Subindo..." : `Upload ${type === "image" ? "Foto" : "Vídeo"}`}</span>
          <input type="file" accept={type === "image" ? "image/*" : "video/*"} className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

/* -------------------- Timeline -------------------- */
function TimelineEditor() {
  const { data, isLoading } = useTimeline();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["timeline_events"] });

  async function add() {
    const nextOrder = (data?.length ?? 0) + 1;
    const { error } = await supabase.from("timeline_events").insert({
      date_text: "Nova data",
      title: "Novo momento",
      description: "Descreva esse momento...",
      place: "",
      sort_order: nextOrder,
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-4">
      {(data ?? []).map((ev) => (
        <TimelineRow key={ev.id} ev={ev} onChange={refresh} />
      ))}
      <Button onClick={add} variant="outline" className="w-full border-dashed py-10 rounded-2xl hover:bg-white/5">
        <Plus className="h-4 w-4" /> Adicionar momento especial
      </Button>
    </div>
  );
}

function TimelineRow({ ev, onChange }: { ev: TimelineEvent; onChange: () => void }) {
  const [form, setForm] = useState(ev);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("timeline_events")
      .update({
        date_text: form.date_text,
        title: form.title,
        description: form.description,
        place: form.place,
        sort_order: form.sort_order,
        image_url: (form as any).image_url,
        video_url: (form as any).video_url,
      } as any)
      .eq("id", ev.id);
    if (error) toast.error(error.message);
    else toast.success("Salvo");
    setSaving(false);
    onChange();
  }

  async function remove() {
    if (!confirm("Remover esse momento?")) return;
    const { error } = await supabase.from("timeline_events").delete().eq("id", ev.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Data</label>
            <Input
                placeholder="Ex: 12 Jun 2023"
                value={form.date_text}
                onChange={(e) => setForm({ ...form, date_text: e.target.value })}
                className="bg-white/5 rounded-xl border-white/5"
            />
        </div>
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Título</label>
            <Input
                placeholder="O que aconteceu?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 rounded-xl border-white/5"
            />
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Descrição</label>
        <Textarea
            placeholder="Conte os detalhes..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5 min-h-[100px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MediaUpload 
            type="image" 
            currentUrl={(form as any).image_url} 
            onUpload={(url) => setForm({ ...form, image_url: url } as any)} 
        />
        <MediaUpload 
            type="video" 
            currentUrl={(form as any).video_url} 
            onUpload={(url) => setForm({ ...form, video_url: url } as any)} 
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex gap-2">
            <Button onClick={save} disabled={saving} size="sm" className="rounded-lg px-6">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button onClick={remove} size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive rounded-lg">
            <Trash2 className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-muted-foreground">Ordem:</span>
            <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-12 bg-transparent text-center text-sm outline-none"
            />
        </div>
      </div>
    </div>
  );
}

/* -------------------- Stats -------------------- */
function StatsEditor() {
  const { data, isLoading } = useStats();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["stats"] });

  async function add() {
    const nextOrder = (data?.length ?? 0) + 1;
    const { error } = await supabase
      .from("stats")
      .insert({ icon: "✨", label: "novo", value: "0", sort_order: nextOrder });
    if (error) toast.error(error.message);
    else refresh();
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-3">
      {(data ?? []).map((s) => (
        <StatRow key={s.id} s={s} onChange={refresh} />
      ))}
      <Button onClick={add} variant="outline" className="w-full border-dashed rounded-xl py-8">
        <Plus className="h-4 w-4" /> Adicionar estatística
      </Button>
    </div>
  );
}

function StatRow({ s, onChange }: { s: Stat; onChange: () => void }) {
  const [form, setForm] = useState(s);
  async function save() {
    const { error } = await supabase
      .from("stats")
      .update({
        icon: form.icon,
        label: form.label,
        value: form.value,
        sort_order: form.sort_order,
      })
      .eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Salvo");
      onChange();
    }
  }
  async function remove() {
    if (!confirm("Remover?")) return;
    const { error } = await supabase.from("stats").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else onChange();
  }
  return (
    <div className="glass grid items-center gap-4 rounded-2xl p-4 sm:grid-cols-[80px_1fr_1fr_80px_auto]">
      <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="bg-white/5 rounded-xl border-white/5" />
      <Input
        placeholder="Rótulo"
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Input
        placeholder="Valor"
        value={form.value}
        onChange={(e) => setForm({ ...form, value: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Input
        type="number"
        value={form.sort_order}
        onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} className="rounded-lg">
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} className="text-muted-foreground hover:text-destructive rounded-lg">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------- Settings (letter + secrets) -------------------- */
function SettingsEditor() {
  const { data: settings, isLoading } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (isLoading || !form) return <Loader />;

  async function save() {
    if (!form) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        love_letter: form.love_letter,
        final_message: form.final_message,
        her_name: form.her_name,
        relationship_start: form.relationship_start,
        secret_message: form.secret_message,
        hidden_video_url: form.hidden_video_url,
        theme_mode: (form as any).theme_mode || 'romantic',
      } as any)
      .eq("id", 1);
    if (error) toast.error(error.message);
    else {
      toast.success("Salvo");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    }
    setSaving(false);
  }

  return (
    <div className="glass space-y-6 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex-1 space-y-1">
            <h3 className="flex items-center gap-2 font-display text-xl">
                <Palette className="h-5 w-5 text-accent" /> Estilo Visual
            </h3>
            <p className="text-xs text-muted-foreground">Escolha como a história será apresentada.</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-white/5 p-1">
            <button
                onClick={() => setForm({ ...form, theme_mode: "romantic" } as any)}
                className={`rounded-lg px-4 py-2 text-xs transition-all cursor-pointer ${
                    (form as any).theme_mode !== "soft-rose" ? "bg-primary shadow-glow" : "hover:bg-white/5"
                }`}
            >
                Romantic Deep
            </button>
            <button
                onClick={() => setForm({ ...form, theme_mode: "soft-rose" } as any)}
                className={`rounded-lg px-4 py-2 text-xs transition-all cursor-pointer ${
                    (form as any).theme_mode === "soft-rose" ? "bg-accent shadow-glow" : "hover:bg-white/5"
                }`}
            >
                Soft Rose
            </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Nome dela</label>
          <Input value={form.her_name} onChange={(e) => setForm({ ...form, her_name: e.target.value })} className="bg-white/5 rounded-xl border-white/5" />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Início do relacionamento
          </label>
          <Input
            type="datetime-local"
            value={form.relationship_start.slice(0, 16)}
            onChange={(e) =>
              setForm({ ...form, relationship_start: new Date(e.target.value).toISOString() })
            }
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Carta de amor</label>
        <Textarea
          rows={10}
          value={form.love_letter}
          onChange={(e) => setForm({ ...form, love_letter: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5 min-h-[200px]"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Mensagem final</label>
        <Textarea
          rows={3}
          value={form.final_message}
          onChange={(e) => setForm({ ...form, final_message: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Segredo (easter eggs)
        </label>
        <Textarea
          rows={2}
          value={form.secret_message}
          onChange={(e) => setForm({ ...form, secret_message: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Vídeo Escondido (Upload ou URL)
        </label>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <Input
                    placeholder="URL do vídeo ou faça upload ->"
                    value={form.hidden_video_url}
                    onChange={(e) => setForm({ ...form, hidden_video_url: e.target.value })}
                    className="bg-white/5 rounded-xl border-white/5"
                />
            </div>
            <MediaUpload 
                type="video" 
                onUpload={(url) => setForm({ ...form, hidden_video_url: url })} 
            />
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="w-full rounded-xl py-6 shadow-glow transition-all hover:scale-[1.01]">
        <Save className="h-4 w-4" /> {saving ? "Salvando alterações..." : "Salvar todas as configurações"}
      </Button>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
