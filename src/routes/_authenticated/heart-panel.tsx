import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo, useRef, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  LogOut,
  Heart,
  Save,
  Loader2,
  Upload,
  X,
  Eye,
  Palette,
  QrCode,
  Download,
  Copy,
  Check,
  History as HistoryIcon,
  RotateCcw,
  Scissors,
  Crosshair,
  Undo2,
  Shapes,
  Maximize,
  Shield,
  Image,
  Link,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import {
  useTimeline,
  useStats,
  useSettings,
  useGallery,
  type TimelineEvent,
  type Stat,
  type SiteSettings,
  type GalleryImage,
} from "@/lib/use-site-content";
import { useQueryClient } from "@tanstack/react-query";
import OurStory from "@/components/OurStory";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import QRStylePicker from "@/components/QRStylePicker";
import { useStyledQRCode } from "@/hooks/use-styled-qr";
import { canvasToBlob, downloadBlob, EXPORT_RESOLUTIONS, renderExportCanvas, type ExportResolution } from "@/lib/qr-export";
import {
  fetchLogoAsDataUrl,
  readImageFileAsDataUrl,
  removeLogoBackground,
} from "@/lib/qr-logo";
import {
  CORNER_DOT_STYLES,
  CORNER_SQUARE_STYLES,
  DOT_STYLES,
  REFERENCE_STYLE_PRESET,
  type CornerDotType,
  type CornerSquareType,
  type DotType,
} from "@/lib/qr-styles";

const COLOR_PRESETS = [
  { fg: "#eb5e8e", bg: "#ffffff", name: "Romance" },
  { fg: "#000000", bg: "#ffffff", name: "Classic" },
  { fg: "#4f46e5", bg: "#ffffff", name: "Indigo" },
  { fg: "#059669", bg: "#ffffff", name: "Emerald" },
  { fg: "#ffffff", bg: "#0d0717", name: "Dark" },
];

const HISTORY_KEY = "qr-generator-history";
const MAX_HISTORY = 10;
const DEFAULT_BORDER_MARGIN = 24;

type ECLevel = "L" | "M" | "Q" | "H";
const EC_LEVELS: { value: ECLevel; label: string; hint: string }[] = [
  { value: "L", label: "L", hint: "~7%" },
  { value: "M", label: "M", hint: "~15%" },
  { value: "Q", label: "Q", hint: "~25%" },
  { value: "H", label: "H", hint: "~30%" },
];

type HistoryItem = {
  id: string;
  text: string;
  fgColor: string;
  bgColor: string;
  size: number;
  level: ECLevel;
  logoUrl: string;
  logoSize: number;
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  createdAt: number;
};

const adminSearchSchema = z.object({
  tab: z.enum(["timeline", "stats", "gallery", "letter", "share"]).optional().default("timeline"),
});

export const Route = createFileRoute("/_authenticated/heart-panel")({
  validateSearch: (search) => adminSearchSchema.parse(search),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const activeTab = search.tab;
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
            <Button
              onClick={() => setShowPreview(true)}
              variant="secondary"
              className="gap-2 rounded-xl"
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button onClick={signOut} variant="outline" className="gap-2 rounded-xl">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({ ...prev, tab: value as any }),
              replace: true,
            })
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 rounded-xl bg-white/5 p-1">
            <TabsTrigger value="timeline" className="rounded-lg">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg">
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg">
              Galeria
            </TabsTrigger>
            <TabsTrigger value="letter" className="rounded-lg">
              Configurações
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-lg">
              Compartilhar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-6">
            <TimelineEditor />
          </TabsContent>
          <TabsContent value="stats" className="mt-6">
            <StatsEditor />
          </TabsContent>
          <TabsContent value="gallery" className="mt-6">
            <GalleryEditor />
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

/* -------------------- Gallery -------------------- */
function GalleryEditor() {
  const { data, isLoading } = useGallery();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["gallery_images"] });

  async function add() {
    const nextOrder = (data?.length ?? 0) + 1;
    const { error } = await supabase.from("gallery_images").insert({
      image_url: "",
      caption: "",
      sort_order: nextOrder,
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(data ?? []).map((img) => (
          <GalleryRow key={img.id} img={img} onChange={refresh} />
        ))}
      </div>
      <Button
        onClick={add}
        variant="outline"
        className="w-full border-dashed py-10 rounded-2xl hover:bg-white/5"
      >
        <Plus className="h-4 w-4" /> Adicionar foto à galeria
      </Button>
    </div>
  );
}

function GalleryRow({ img, onChange }: { img: GalleryImage; onChange: () => void }) {
  const [form, setForm] = useState(img);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("gallery_images")
      .update({
        image_url: form.image_url,
        caption: form.caption,
        sort_order: form.sort_order,
      })
      .eq("id", img.id);
    if (error) toast.error(error.message);
    else toast.success("Salvo");
    setSaving(false);
    onChange();
  }

  async function remove() {
    if (!confirm("Remover essa foto?")) return;
    const { error } = await supabase.from("gallery_images").delete().eq("id", img.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-4">
      <MediaUpload
        type="image"
        currentUrl={form.image_url}
        onUpload={(url) => setForm({ ...form, image_url: url })}
      />

      <Input
        placeholder="Legenda (opcional)"
        value={form.caption || ""}
        onChange={(e) => setForm({ ...form, caption: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} size="sm" className="rounded-lg px-4">
            {saving ? "..." : "Salvar"}
          </Button>
          <Button
            onClick={remove}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-muted-foreground">Ordem:</span>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            className="w-10 bg-transparent text-center text-sm outline-none"
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------- Share Panel -------------------- */
function SharePanel() {
  const [url, setUrl] = useState("");
  const [fgColor, setFgColor] = useState("#eb5e8e");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(280);
  const [level, setLevel] = useState<ECLevel>("H");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoInput, setLogoInput] = useState("");
  const [logoSize, setLogoSize] = useState(50);
  const [logoExcavate, setLogoExcavate] = useState(true);
  const [logoOriginalUrl, setLogoOriginalUrl] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dotStyle, setDotStyle] = useState<DotType>(REFERENCE_STYLE_PRESET.dotStyle);
  const [cornerSquareStyle, setCornerSquareStyle] = useState<CornerSquareType>(
    REFERENCE_STYLE_PRESET.cornerSquareStyle,
  );
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotType>(
    REFERENCE_STYLE_PRESET.cornerDotStyle,
  );
  const [includeMargin, setIncludeMargin] = useState(true);
  const [borderMargin, setBorderMargin] = useState(DEFAULT_BORDER_MARGIN);
  const [exportResolution, setExportResolution] = useState<ExportResolution>("preview");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(window.location.origin);
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  const handleLogoFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 2MB");
      return;
    }
    try {
      const result = await readImageFileAsDataUrl(file);
      setLogoUrl(result);
      setLogoPreview(result);
      setLogoOriginalUrl(null);
      toast.success("Logo enviada!");
    } catch {
      toast.error("Erro ao ler a imagem");
    }
  }, []);

  const handleLogoUrlChange = useCallback(async (value: string) => {
    setLogoInput(value);
    if (!value) {
      setLogoUrl("");
      setLogoPreview(null);
      return;
    }
    if (value.startsWith("data:")) {
      setLogoUrl(value);
      setLogoPreview(value);
      return;
    }
    setLogoPreview(value);
    setLogoUrl("");
    try {
      const dataUrl = await fetchLogoAsDataUrl(value);
      setLogoUrl(dataUrl);
      setLogoPreview(dataUrl);
      setLogoOriginalUrl(null);
      toast.success("Logo carregada!");
    } catch {
      setLogoPreview(null);
      toast.error("Não foi possível carregar. Tente fazer upload do arquivo.");
    }
  }, []);

  const clearLogo = useCallback(() => {
    setLogoUrl("");
    setLogoInput("");
    setLogoPreview(null);
    setLogoOriginalUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleRemoveLogoBackground = useCallback(async () => {
    if (!logoUrl) return;
    setRemovingBg(true);
    try {
      const out = await removeLogoBackground(logoUrl);
      setLogoOriginalUrl((prev) => prev ?? logoUrl);
      setLogoUrl(out);
      setLogoPreview(out);
      toast.success("Fundo removido");
    } catch {
      toast.error("Não foi possível remover o fundo");
    } finally {
      setRemovingBg(false);
    }
  }, [logoUrl]);

  const restoreLogoBackground = useCallback(() => {
    if (!logoOriginalUrl) return;
    setLogoUrl(logoOriginalUrl);
    setLogoPreview(logoOriginalUrl);
    setLogoOriginalUrl(null);
    toast.success("Logo original restaurada");
  }, [logoOriginalUrl]);

  const styledQROptions = useMemo(
    () => ({
      data: url,
      size,
      fgColor,
      bgColor,
      level,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      logoUrl,
      logoSize,
      logoExcavate,
    }),
    [
      url,
      size,
      fgColor,
      bgColor,
      level,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      logoUrl,
      logoSize,
      logoExcavate,
    ],
  );

  useStyledQRCode(qrCanvasRef, styledQROptions);

  const saveToHistory = useCallback(() => {
    if (!url.trim()) return;
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: url,
      fgColor,
      bgColor,
      size,
      level,
      logoUrl,
      logoSize,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      createdAt: Date.now(),
    };
    const filtered = history.filter(
      (h) =>
        !(
          h.text === item.text &&
          h.fgColor === item.fgColor &&
          h.bgColor === item.bgColor &&
          h.dotStyle === item.dotStyle &&
          h.cornerSquareStyle === item.cornerSquareStyle &&
          h.cornerDotStyle === item.cornerDotStyle &&
          h.logoUrl === item.logoUrl
        ),
    );
    const nextHistory = [item, ...filtered].slice(0, MAX_HISTORY);
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  }, [
    url,
    fgColor,
    bgColor,
    size,
    level,
    logoUrl,
    logoSize,
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
    history,
  ]);

  const downloadQR = useCallback(async () => {
    if (!url.trim() || isExporting) return;

    setIsExporting(true);
    try {
      const margin = includeMargin ? borderMargin : 0;
      const exportCanvas = await renderExportCanvas(
        styledQROptions,
        margin,
        exportResolution,
        exportResolution === "preview" ? qrCanvasRef.current?.querySelector("canvas") : undefined,
      );
      const blob = await canvasToBlob(exportCanvas);
      const resolutionLabel =
        EXPORT_RESOLUTIONS.find((r) => r.value === exportResolution)?.label ?? "preview";
      downloadBlob(blob, `qrcode-historia-${resolutionLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`);
      saveToHistory();
      toast.success("QR Code baixado!");
    } catch {
      toast.error("Erro ao exportar. Faça upload da logo novamente.");
    } finally {
      setIsExporting(false);
    }
  }, [url, styledQROptions, includeMargin, borderMargin, exportResolution, isExporting, saveToHistory]);

  const restoreItem = (item: HistoryItem) => {
    setFgColor(item.fgColor);
    setBgColor(item.bgColor);
    setSize(item.size);
    setLevel(item.level);
    setLogoUrl(item.logoUrl);
    setLogoPreview(item.logoUrl || null);
    setLogoInput("");
    setLogoOriginalUrl(null);
    setLogoSize(item.logoSize);
    setDotStyle(item.dotStyle);
    setCornerSquareStyle(item.cornerSquareStyle);
    setCornerDotStyle(item.cornerDotStyle);
    toast.success("Configuração restaurada");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="glass flex min-h-[500px] flex-col items-center justify-center gap-8 rounded-3xl p-8 text-center">
        <div className="relative group">
          <div
            className="rounded-3xl p-6 shadow-glow transition-all duration-500 group-hover:scale-105"
            style={{ backgroundColor: bgColor }}
          >
            <div
              ref={qrCanvasRef}
              className="flex items-center justify-center"
              style={{ width: size, height: size }}
            />
          </div>
          <div className="absolute -inset-4 z-[-10] animate-spin-slow rounded-[40px] border-2 border-dashed border-accent/20" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-3xl">Sua História está Pronta!</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Personalize cada detalhe do seu QR Code para deixá-lo único.
          </p>
        </div>

        <div className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-2">
          <Input value={url} readOnly className="border-none bg-transparent focus-visible:ring-0" />
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopied(true);
              toast.success("Link copiado!");
              setTimeout(() => setCopied(false), 2000);
            }}
            className="rounded-xl px-6"
          >
            {copied ? <Check className="h-4 w-4" /> : "Copiar"}
          </Button>
        </div>

        <div className="flex w-full gap-3 max-w-sm">
          <Button
            onClick={downloadQR}
            disabled={isExporting}
            className="flex-1 h-12 rounded-xl gap-2 shadow-glow"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Baixar PNG
          </Button>
        </div>
      </div>

      <div className="glass flex h-fit flex-col gap-6 rounded-3xl p-6 overflow-hidden">
        <h4 className="flex items-center gap-2 font-display text-lg">
          <Palette className="h-5 w-5 text-accent" /> Estilo & Design
        </h4>

        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10 bg-white/5 p-1 rounded-xl">
            <TabsTrigger value="style" className="text-xs rounded-lg">
              Design
            </TabsTrigger>
            <TabsTrigger value="logo" className="text-xs rounded-lg">
              Logo
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs rounded-lg">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="mt-4 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full h-11 gap-2 text-xs rounded-xl">
                      <Palette className="w-4 h-4" /> Cores
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 space-y-4 glass border-white/10">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Presets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => {
                              setFgColor(p.fg);
                              setBgColor(p.bg);
                            }}
                            className="h-8 w-8 rounded-full border-2 border-white/10 transition-transform hover:scale-110"
                            style={{ backgroundColor: p.fg }}
                            title={p.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Pixel</label>
                        <input
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-full h-8 cursor-pointer rounded-lg bg-transparent border-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Fundo</label>
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-full h-8 cursor-pointer rounded-lg bg-transparent border-none"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full h-11 gap-2 text-xs rounded-xl">
                      <Maximize className="w-4 h-4" /> Tamanho
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 glass border-white/10">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      QR Size: {size}px
                    </label>
                    <Slider
                      value={[size]}
                      onValueChange={([v]) => setSize(v)}
                      min={128}
                      max={512}
                      step={32}
                      className="mt-4 accent-accent"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4 rounded-2xl bg-white/5 p-4 border border-white/5">
                <QRStylePicker
                  title="Pixel"
                  category="dot"
                  options={DOT_STYLES}
                  value={dotStyle}
                  onChange={setDotStyle}
                />
                <QRStylePicker
                  title="Canto Externo"
                  category="cornerSquare"
                  options={CORNER_SQUARE_STYLES}
                  value={cornerSquareStyle}
                  onChange={setCornerSquareStyle}
                />
                <QRStylePicker
                  title="Canto Interno"
                  category="cornerDot"
                  options={CORNER_DOT_STYLES}
                  value={cornerDotStyle}
                  onChange={setCornerDotStyle}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logo" className="mt-4 space-y-4">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Logo Central
            </Label>

            {logoPreview && (
              <div className="relative w-full flex justify-center">
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Preview da logo"
                    className="w-16 h-16 object-contain rounded-lg border border-white/10 bg-white/5"
                    onError={() => {
                      setLogoPreview(null);
                      toast.error("Erro ao carregar imagem");
                    }}
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9 bg-white/5">
                <TabsTrigger value="upload" className="text-xs gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  URL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-3 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                  id="share-logo-upload"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-20 border-2 border-dashed border-white/10 hover:border-accent/50 flex flex-col gap-2 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Clique para enviar imagem</span>
                </Button>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  PNG, JPG, SVG • Máx. 2MB
                </p>
              </TabsContent>
              <TabsContent value="url" className="mt-3 space-y-3">
                <Input
                  type="text"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoInput}
                  onChange={(e) => void handleLogoUrlChange(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground/60">
                  A imagem precisa permitir CORS; caso contrário, faça upload do arquivo.
                </p>
              </TabsContent>
            </Tabs>

            {logoUrl && (
              <div className="space-y-4 pt-3 border-t border-white/5">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>TAMANHO DA LOGO</span>
                    <span>{logoSize}px</span>
                  </div>
                  <Slider
                    value={[logoSize]}
                    onValueChange={([v]) => setLogoSize(v)}
                    min={20}
                    max={Math.round(size * 0.4)}
                    step={2}
                    className="accent-accent"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-foreground">Recortar fundo</div>
                    <div className="text-[10px] text-muted-foreground">
                      Remove os pixels do QR atrás da logo
                    </div>
                  </div>
                  <Switch checked={logoExcavate} onCheckedChange={setLogoExcavate} />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs rounded-xl"
                    onClick={() => void handleRemoveLogoBackground()}
                    disabled={removingBg}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    {removingBg ? "Removendo…" : "Remover fundo"}
                  </Button>
                  {logoOriginalUrl && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 text-xs rounded-xl"
                      onClick={restoreLogoBackground}
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Restaurar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Recentes ({history.length})
                </label>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem(HISTORY_KEY);
                    }}
                    className="h-7 text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {history.length === 0 ? (
                  <p className="text-center py-8 text-xs text-muted-foreground italic">
                    Nenhum histórico ainda.
                  </p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div
                        className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center border border-white/10"
                        style={{ backgroundColor: item.bgColor }}
                      >
                        <QrCode className="h-5 w-5" style={{ color: item.fgColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground truncate">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-mono opacity-50 truncate">
                          {item.dotStyle} · {item.level}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreItem(item)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-accent"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Switch id="margin-mode" checked={includeMargin} onCheckedChange={setIncludeMargin} />
            <label htmlFor="margin-mode" className="text-xs text-muted-foreground cursor-pointer">
              Incluir margem branca no download
            </label>
          </div>

          {includeMargin && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>BORDA LATERAL</span>
                <span>{borderMargin}px</span>
              </div>
              <Slider
                value={[borderMargin]}
                onValueChange={([v]) => setBorderMargin(v)}
                min={0}
                max={80}
                step={2}
                className="accent-accent"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Resolução
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {EXPORT_RESOLUTIONS.map((resolution) => (
                <Button
                  key={resolution.value}
                  type="button"
                  variant={exportResolution === resolution.value ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setExportResolution(resolution.value)}
                  className="flex flex-col h-auto py-2 rounded-xl"
                >
                  <span className="font-semibold text-xs">{resolution.label}</span>
                  <span className="text-[10px] opacity-70">
                    {resolution.size
                      ? `${resolution.size}×${resolution.size}`
                      : `${size + (includeMargin ? borderMargin : 0) * 2}px`}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Media Upload Component -------------------- */
function MediaUpload({
  onUpload,
  currentUrl,
  type = "image",
}: {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
  type?: "image" | "video";
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from("assets").upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
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
            <img
              src={currentUrl}
              alt="Preview"
              className="h-20 w-32 rounded-lg object-cover shadow-soft"
            />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-white/10 text-xs border border-white/5">
              Vídeo
            </div>
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
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>{uploading ? "Subindo..." : `Upload ${type === "image" ? "Foto" : "Vídeo"}`}</span>
          <input
            type="file"
            accept={type === "image" ? "image/*" : "video/*"}
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
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
      <Button
        onClick={add}
        variant="outline"
        className="w-full border-dashed py-10 rounded-2xl hover:bg-white/5"
      >
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
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
            Data
          </label>
          <Input
            placeholder="Ex: 12 Jun 2023"
            value={form.date_text}
            onChange={(e) => setForm({ ...form, date_text: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
            Título
          </label>
          <Input
            placeholder="O que aconteceu?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
            Local (Opcional)
          </label>
          <Input
            placeholder="Ex: Praia de Copacabana"
            value={form.place || ""}
            onChange={(e) => setForm({ ...form, place: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
          Descrição
        </label>

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
          <Button
            onClick={remove}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive rounded-lg"
          >
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
      <Input
        value={form.icon}
        onChange={(e) => setForm({ ...form, icon: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
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
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          className="text-muted-foreground hover:text-destructive rounded-lg"
        >
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
        theme_mode: (form as any).theme_mode || "romantic",
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
              (form as any).theme_mode !== "soft-rose"
                ? "bg-primary shadow-glow"
                : "hover:bg-white/5"
            }`}
          >
            Romantic Deep
          </button>
          <button
            onClick={() => setForm({ ...form, theme_mode: "soft-rose" } as any)}
            className={`rounded-lg px-4 py-2 text-xs transition-all cursor-pointer ${
              (form as any).theme_mode === "soft-rose"
                ? "bg-accent shadow-glow"
                : "hover:bg-white/5"
            }`}
          >
            Soft Rose
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Nome dela
          </label>
          <Input
            value={form.her_name}
            onChange={(e) => setForm({ ...form, her_name: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
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
        <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Carta de amor
        </label>
        <Textarea
          rows={10}
          value={form.love_letter}
          onChange={(e) => setForm({ ...form, love_letter: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5 min-h-[200px]"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Mensagem final
        </label>
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
      <Button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl py-6 shadow-glow transition-all hover:scale-[1.01]"
      >
        <Save className="h-4 w-4" />{" "}
        {saving ? "Salvando alterações..." : "Salvar todas as configurações"}
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
