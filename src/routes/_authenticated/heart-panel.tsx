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
  Printer,
  Shield,
  Image,
  Link,
  MapPin,
  Mail,
  ArrowUpDown,
} from "lucide-react";
import {
  AdminOrderActions,
  AdminOrderHeader,
  AdminOrderHint,
  AdminOrderableGrid,
  AdminOrderableShell,
} from "@/components/admin/AdminOrderableCard";
import { sortGalleryByDate, sortGalleryImages } from "@/lib/gallery-sort";
import {
  nextSortOrder,
  persistTableOrder,
  sortByOrder,
  swapInList,
} from "@/lib/admin-order";
import { isHeicFile, prepareImageForUpload } from "@/lib/prepare-upload-image";
import StoryVideoPlayer from "@/components/story/StoryVideoPlayer";
import { useAuth } from "@/lib/use-auth";
import {
  useTimeline,
  useStats,
  useSettings,
  useGallery,
  usePlaces,
  useMemoryEnvelopes,
  useLoveNotes,
  type TimelineEvent,
  type Stat,
  type SiteSettings,
  type GalleryImage,
  type Place,
  type MemoryEnvelope,
  type LoveNote,
} from "@/lib/use-site-content";
import IconPicker from "@/components/IconPicker";
import { GatePasswordPreview, StoryDatePicker, StoryDateTextPicker } from "@/components/StoryDate";
import { parseStoryDate, toDateOnlyString } from "@/lib/story-date";
import { toastRomanticSave } from "@/lib/romantic-toast";
import { SEED_MEMORY_ENVELOPES, SEED_PLACES } from "@/lib/content-seeds";
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
  renderPrintCardBackCanvas,
  renderPrintCardFrontCanvas,
  renderPrintCardSheetCanvas,
} from "@/lib/qr-print-card";
import {
  fitImageToSquare,
  logoProcessPixelSize,
  MAX_LOGO_FILE_BYTES,
  readImageFileNormalized,
  type ImageFitMode,
} from "@/lib/image-fit";
import {
  fetchLogoAsDataUrl,
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

const ADMIN_TABS = ["timeline", "stats", "places", "gallery", "memories", "notes", "letter", "share"] as const;

const adminSearchSchema = z.object({
  tab: z.enum(ADMIN_TABS).optional().default("timeline"),
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
          onValueChange={(value) => {
            const tab = ADMIN_TABS.find((t) => t === value);
            if (!tab) return;
            navigate({
              to: "/heart-panel",
              search: (prev) => ({ ...prev, tab }),
              replace: true,
            });
          }}
          className="w-full"
        >
          <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-xl bg-white/5 p-1">
            <TabsTrigger value="timeline" className="rounded-lg text-xs sm:text-sm">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg text-xs sm:text-sm">
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="places" className="rounded-lg text-xs sm:text-sm">
              Lugares
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg text-xs sm:text-sm">
              Galeria
            </TabsTrigger>
            <TabsTrigger value="memories" className="rounded-lg text-xs sm:text-sm">
              Memórias
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg text-xs sm:text-sm">
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="letter" className="rounded-lg text-xs sm:text-sm">
              Configurações
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-lg text-xs sm:text-sm">
              Compartilhar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-6">
            <TimelineEditor />
          </TabsContent>
          <TabsContent value="stats" className="mt-6">
            <StatsEditor />
          </TabsContent>
          <TabsContent value="places" className="mt-6">
            <PlacesEditor />
          </TabsContent>
          <TabsContent value="gallery" className="mt-6">
            <GalleryEditor />
          </TabsContent>
          <TabsContent value="memories" className="mt-6">
            <MemoriesEditor />
          </TabsContent>
          <TabsContent value="notes" className="mt-6">
            <LoveNotesEditor />
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
  const sorted = useMemo(() => sortGalleryImages(data ?? []), [data]);

  async function add() {
    const maxOrder = sorted.reduce((max, img) => Math.max(max, img.sort_order), 0);
    const { error } = await supabase.from("gallery_images").insert({
      image_url: "",
      caption: "",
      sort_order: maxOrder + 1,
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function moveImage(id: string, direction: "up" | "down") {
    const list = sortGalleryImages(data ?? []);
    const index = list.findIndex((img) => img.id === id);
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;

    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];

    try {
      await persistTableOrder("gallery_images", next);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  async function sortByDate() {
    const list = sortGalleryByDate(data ?? []);
    try {
      await persistTableOrder("gallery_images", list);
      refresh();
      toast.success("Galeria ordenada por data!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ordenar");
    }
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-4">
      <AdminOrderHint
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void sortByDate()}
            className="gap-2 rounded-xl"
          >
            <ArrowUpDown className="h-4 w-4" />
            Ordenar por data
          </Button>
        }
      >
        <p>
          A ordem aqui é <span className="text-foreground">esquerda → direita</span> no site.
          Use as setas em cada card para reorganizar.
        </p>
      </AdminOrderHint>
      <AdminOrderableGrid>
        {sorted.map((img, index) => (
          <GalleryRow
            key={img.id}
            img={img}
            position={index + 1}
            total={sorted.length}
            onMoveUp={() => void moveImage(img.id, "up")}
            onMoveDown={() => void moveImage(img.id, "down")}
            onChange={refresh}
          />
        ))}
      </AdminOrderableGrid>
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

function GalleryRow({
  img,
  position,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  img: GalleryImage;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(img);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(img);
  }, [img]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("gallery_images")
      .update({
        image_url: form.image_url,
        caption: form.caption,
        title: form.title,
        description: form.description,
        location: form.location,
        taken_at: form.taken_at || null,
      })
      .eq("id", img.id);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("gallery");
      onChange();
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remover essa foto?")) return;
    const { error } = await supabase.from("gallery_images").delete().eq("id", img.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  const subtitle = form.taken_at
    ? new Date(`${form.taken_at}T12:00:00`).toLocaleDateString("pt-BR")
    : undefined;

  return (
    <AdminOrderableShell>
      <AdminOrderHeader
        position={position}
        total={total}
        title={`Foto ${position} de ${total}`}
        subtitle={subtitle}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      <MediaUpload
        type="image"
        currentUrl={form.image_url}
        onUpload={(url) => setForm({ ...form, image_url: url })}
      />

      <Input
        placeholder="Título"
        value={form.title || ""}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Input
        placeholder="Legenda curta (opcional)"
        value={form.caption || ""}
        onChange={(e) => setForm({ ...form, caption: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Textarea
        rows={2}
        placeholder="Descrição (opcional)"
        value={form.description || ""}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Local"
          value={form.location || ""}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5"
        />
        <Input
          type="date"
          value={form.taken_at || ""}
          onChange={(e) => setForm({ ...form, taken_at: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5"
        />
      </div>

      <AdminOrderActions
        onSave={save}
        onRemove={remove}
        saving={saving}
        position={position}
      />
    </AdminOrderableShell>
  );
}

/* -------------------- Share Panel -------------------- */
function SharePanel() {
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [fgColor, setFgColor] = useState("#eb5e8e");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(280);
  const [level, setLevel] = useState<ECLevel>("H");
  const [logoSource, setLogoSource] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoInput, setLogoInput] = useState("");
  const [logoSize, setLogoSize] = useState(112);
  const [logoFitMode, setLogoFitMode] = useState<ImageFitMode>("cover");
  const [logoFocalX, setLogoFocalX] = useState(50);
  const [logoFocalY, setLogoFocalY] = useState(42);
  const [logoZoom, setLogoZoom] = useState(108);
  const [logoProcessing, setLogoProcessing] = useState(false);
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
  const [isPrintingCard, setIsPrintingCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardTagline, setCardTagline] = useState("Algo feito só para você");
  const [cardScanLine, setCardScanLine] = useState("Escaneie para abrir nossa história");
  const [cardBackMessage, setCardBackMessage] = useState("");
  const [savingCardText, setSavingCardText] = useState(false);

  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(window.location.origin);
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (!settings) return;
    setCardTagline(settings.print_card_tagline || "Algo feito só para você");
    setCardScanLine(settings.print_card_scan_line || "Escaneie para abrir nossa história");
    setCardBackMessage(settings.print_card_back_message || "");
  }, [settings]);

  useEffect(() => {
    if (!logoSource) {
      setLogoUrl("");
      return;
    }

    let cancelled = false;
    setLogoProcessing(true);

    void fitImageToSquare(logoSource, {
      size: logoProcessPixelSize(size, logoSize),
      mode: logoFitMode,
      focalX: logoFocalX,
      focalY: logoFocalY,
      zoom: logoZoom / 100,
      bgColor,
    })
      .then((processed) => {
        if (!cancelled) {
          setLogoUrl(processed);
          setLogoPreview(processed);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Erro ao ajustar a foto");
      })
      .finally(() => {
        if (!cancelled) setLogoProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logoSource, logoFitMode, logoFocalX, logoFocalY, logoZoom, bgColor, size, logoSize]);

  const handleLogoFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !isHeicFile(file)) {
      toast.error("Envie um arquivo de imagem");
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      toast.error("A imagem deve ter menos de 10MB");
      return;
    }
    try {
      const result = await readImageFileNormalized(file);
      setLogoSource(result);
      setLogoOriginalUrl(null);
      setLogoSize(Math.round(size * 0.42));
      toast.success("Foto enviada! Ajuste o enquadramento abaixo.");
    } catch {
      toast.error("Erro ao ler a imagem");
    }
  }, []);

  const handleLogoUrlChange = useCallback(async (value: string) => {
    setLogoInput(value);
    if (!value) {
      setLogoSource("");
      setLogoUrl("");
      setLogoPreview(null);
      return;
    }
    if (value.startsWith("data:")) {
      setLogoSource(value);
      return;
    }
    setLogoPreview(value);
    setLogoUrl("");
    try {
      const dataUrl = await fetchLogoAsDataUrl(value);
      setLogoSource(dataUrl);
      setLogoOriginalUrl(null);
      toast.success("Foto carregada!");
    } catch {
      setLogoPreview(null);
      toast.error("Não foi possível carregar. Tente fazer upload do arquivo.");
    }
  }, []);

  const clearLogo = useCallback(() => {
    setLogoSource("");
    setLogoUrl("");
    setLogoInput("");
    setLogoPreview(null);
    setLogoOriginalUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleRemoveLogoBackground = useCallback(async () => {
    const source = logoSource || logoUrl;
    if (!source) return;
    setRemovingBg(true);
    try {
      const out = await removeLogoBackground(source);
      setLogoOriginalUrl((prev) => prev ?? source);
      setLogoSource(out);
      toast.success("Fundo removido");
    } catch {
      toast.error("Não foi possível remover o fundo");
    } finally {
      setRemovingBg(false);
    }
  }, [logoSource, logoUrl]);

  const restoreLogoBackground = useCallback(() => {
    if (!logoOriginalUrl) return;
    setLogoSource(logoOriginalUrl);
    setLogoOriginalUrl(null);
    toast.success("Foto original restaurada");
  }, [logoOriginalUrl]);

  const printCardLayout = useMemo(
    () => ({
      herName: settings?.her_name,
      tagline: cardTagline,
      scanLine: cardScanLine,
      backMessage: cardBackMessage,
    }),
    [settings?.her_name, cardTagline, cardScanLine, cardBackMessage],
  );

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

  const downloadPrintCard = useCallback(async () => {
    if (!url.trim() || isPrintingCard) return;

    setIsPrintingCard(true);
    try {
      const margin = includeMargin ? borderMargin : 0;
      const sheet = await renderPrintCardSheetCanvas(styledQROptions, margin, printCardLayout);
      const blob = await canvasToBlob(sheet);
      downloadBlob(blob, `cartao-frente-verso-${Date.now()}.png`);
      toast.success("Cartão frente + verso baixado!");
    } catch {
      toast.error("Erro ao gerar cartão. Tente novamente.");
    } finally {
      setIsPrintingCard(false);
    }
  }, [url, styledQROptions, includeMargin, borderMargin, isPrintingCard, printCardLayout]);

  const downloadPrintCardFront = useCallback(async () => {
    if (!url.trim() || isPrintingCard) return;
    setIsPrintingCard(true);
    try {
      const margin = includeMargin ? borderMargin : 0;
      const canvas = await renderPrintCardFrontCanvas(styledQROptions, margin, printCardLayout);
      downloadBlob(await canvasToBlob(canvas), `cartao-frente-${Date.now()}.png`);
      toast.success("Frente baixada!");
    } catch {
      toast.error("Erro ao gerar frente.");
    } finally {
      setIsPrintingCard(false);
    }
  }, [url, styledQROptions, includeMargin, borderMargin, isPrintingCard, printCardLayout]);

  const downloadPrintCardBack = useCallback(async () => {
    if (isPrintingCard) return;
    setIsPrintingCard(true);
    try {
      const canvas = await renderPrintCardBackCanvas(printCardLayout);
      downloadBlob(await canvasToBlob(canvas), `cartao-verso-${Date.now()}.png`);
      toast.success("Verso baixado!");
    } catch {
      toast.error("Erro ao gerar verso.");
    } finally {
      setIsPrintingCard(false);
    }
  }, [isPrintingCard, printCardLayout]);

  const savePrintCardTexts = useCallback(async () => {
    setSavingCardText(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        print_card_tagline: cardTagline,
        print_card_scan_line: cardScanLine,
        print_card_back_message: cardBackMessage,
      })
      .eq("id", 1);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("settings");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    }
    setSavingCardText(false);
  }, [cardTagline, cardScanLine, cardBackMessage, qc]);

  const restoreItem = (item: HistoryItem) => {
    setFgColor(item.fgColor);
    setBgColor(item.bgColor);
    setSize(item.size);
    setLevel(item.level);
    setLogoUrl(item.logoUrl);
    setLogoSource(item.logoUrl);
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

        <div className="flex w-full flex-col gap-3 max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Textos do cartão
            </p>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Subtítulo (frente)</Label>
              <Input
                value={cardTagline}
                onChange={(e) => setCardTagline(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Instrução abaixo do QR</Label>
              <Input
                value={cardScanLine}
                onChange={(e) => setCardScanLine(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mensagem do verso</Label>
              <Textarea
                rows={4}
                value={cardBackMessage}
                onChange={(e) => setCardBackMessage(e.target.value)}
                placeholder="Escreva uma carta curta para o verso do cartão impresso..."
                className="bg-white/5 border-white/10 min-h-[100px]"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={savingCardText}
              onClick={() => void savePrintCardTexts()}
              className="w-full rounded-xl"
            >
              {savingCardText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar textos do cartão
            </Button>
          </div>

          <Button
            onClick={downloadPrintCard}
            disabled={isPrintingCard || isExporting}
            className="h-12 rounded-xl gap-2 shadow-glow"
          >
            {isPrintingCard ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Baixar frente + verso (A6)
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void downloadPrintCardFront()}
              disabled={isPrintingCard || isExporting}
              className="h-10 rounded-xl border-white/10 text-xs"
            >
              Só frente
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void downloadPrintCardBack()}
              disabled={isPrintingCard || isExporting}
              className="h-10 rounded-xl border-white/10 text-xs"
            >
              Só verso
            </Button>
          </div>
          <Button
            onClick={downloadQR}
            disabled={isExporting || isPrintingCard}
            variant="outline"
            className="h-11 rounded-xl gap-2 border-white/10"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Só o QR Code (PNG)
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Cartão A6 em 300 DPI. Imprima frente e verso em papel grosso — ou use o arquivo
            combinado com linha de corte.
          </p>
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
                      <label htmlFor="presets" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Presets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
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
                        <label htmlFor="pixel" className="text-[10px] text-muted-foreground">Pixel</label>
                        <input
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-full h-8 cursor-pointer rounded-lg bg-transparent border-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="background" className="text-[10px] text-muted-foreground">Fundo</label>
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
                    <label htmlFor="qr-size" className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
              Foto no centro do QR
            </Label>

            {(logoPreview || logoSource) && (
              <div className="relative w-full flex flex-col items-center gap-3">
                <div className="relative">
                  <div
                    className="h-28 w-28 overflow-hidden rounded-2xl border-2 border-accent/30 bg-white shadow-glow"
                    style={{ backgroundColor: bgColor }}
                  >
                    {logoProcessing ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                      </div>
                    ) : (
                      <img
                        src={logoPreview ?? logoSource}
                        alt="Preview da foto no QR"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center max-w-[220px]">
                  Preview quadrado — é assim que aparece no QR
                </p>
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
                    size="sm"
                    className="flex-1 gap-1.5 text-xs rounded-xl w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={removingBg}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Enviar imagem
                  </Button>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  PNG, JPG, WEBP • Máx. 20MB
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

            {logoSource && (
              <div className="space-y-4 pt-3 border-t border-white/5">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={logoFitMode === "cover" ? "default" : "secondary"}
                    size="sm"
                    className="text-xs rounded-xl"
                    onClick={() => setLogoFitMode("cover")}
                  >
                    Preencher
                  </Button>
                  <Button
                    type="button"
                    variant={logoFitMode === "contain" ? "default" : "secondary"}
                    size="sm"
                    className="text-xs rounded-xl"
                    onClick={() => setLogoFitMode("contain")}
                  >
                    Caber inteira
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>POSIÇÃO HORIZONTAL</span>
                    <span>{logoFocalX}%</span>
                  </div>
                  <Slider
                    value={[logoFocalX]}
                    onValueChange={([v]) => setLogoFocalX(v)}
                    min={0}
                    max={100}
                    step={1}
                    disabled={logoFitMode === "contain"}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>POSIÇÃO VERTICAL</span>
                    <span>{logoFocalY}%</span>
                  </div>
                  <Slider
                    value={[logoFocalY]}
                    onValueChange={([v]) => setLogoFocalY(v)}
                    min={0}
                    max={100}
                    step={1}
                    disabled={logoFitMode === "contain"}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>ZOOM</span>
                    <span>{logoZoom}%</span>
                  </div>
                  <Slider
                    value={[logoZoom]}
                    onValueChange={([v]) => setLogoZoom(v)}
                    min={100}
                    max={160}
                    step={2}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>TAMANHO NO QR</span>
                    <span>{logoSize}px</span>
                  </div>
                  <Slider
                    value={[logoSize]}
                    onValueChange={([v]) => setLogoSize(v)}
                    min={64}
                    max={Math.round(size * 0.52)}
                    step={2}
                    className="accent-accent"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round((logoSize / size) * 100)}% do QR — recomendado 38–45%
                  </p>
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
                <label htmlFor="recentes" className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
                        type="button"
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
  type?: "image" | "video" | "audio";
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let uploadFile = file;
      if (type === "image") {
        const wasHeic = isHeicFile(file);
        uploadFile = await prepareImageForUpload(file);
        if (wasHeic) {
          toast.message("Convertendo HEIC para JPEG em alta qualidade…", { duration: 2000 });
        }
      }

      const fileExt = uploadFile.name.split(".").pop() || "bin";
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, uploadFile, {
          contentType: uploadFile.type || undefined,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
      onUpload(data.publicUrl);
      toast.success(
        type === "image" && isHeicFile(file) ? "HEIC convertido e enviado!" : "Upload concluído!",
      );
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
          ) : type === "video" ? (
            <video
              src={currentUrl}
              controls
              playsInline
              preload="metadata"
              className="h-20 w-32 rounded-lg border border-white/5 bg-black object-cover"
            />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-white/10 text-xs border border-white/5">
              Áudio
            </div>
          )}
          <button
            type="button"
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
          <span>
            {uploading
              ? "Subindo..."
              : `Upload ${type === "image" ? "Foto" : type === "audio" ? "Áudio" : "Vídeo"}`}
          </span>
          <input
            type="file"
            accept={
              type === "image"
                ? "image/*,.heic,.heif"
                : type === "audio"
                  ? "audio/*"
                  : "video/*"
            }
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
  const sorted = useMemo(() => sortByOrder(data ?? []), [data]);

  async function add() {
    const { error } = await supabase.from("timeline_events").insert({
      date_text: "",
      title: "",
      description: "",
      place: "",
      sort_order: nextSortOrder(sorted),
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function moveEvent(id: string, direction: "up" | "down") {
    const next = swapInList(sorted, id, direction);
    if (!next) return;
    try {
      await persistTableOrder("timeline_events", next);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-4">
      <AdminOrderHint>
        <p>
          A ordem aqui é <span className="text-foreground">de cima para baixo</span> na linha do
          tempo. Use as setas em cada card para reorganizar.
        </p>
      </AdminOrderHint>
      <AdminOrderableGrid>
        {sorted.map((ev, index) => (
          <TimelineRow
            key={ev.id}
            ev={ev}
            position={index + 1}
            total={sorted.length}
            onMoveUp={() => void moveEvent(ev.id, "up")}
            onMoveDown={() => void moveEvent(ev.id, "down")}
            onChange={refresh}
          />
        ))}
      </AdminOrderableGrid>
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

function TimelineRow({
  ev,
  position,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  ev: TimelineEvent;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(ev);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(ev);
  }, [ev]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("timeline_events")
      .update({
        date_text: form.date_text,
        title: form.title,
        description: form.description,
        place: form.place,
        image_url: form.image_url,
        video_url: form.video_url,
        icon_name: form.icon_name,
      })
      .eq("id", ev.id);
    if (error) toast.error(error.message);
    else toastRomanticSave("timeline");
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
    <AdminOrderableShell>
      <AdminOrderHeader
        position={position}
        total={total}
        title={`Momento ${position} de ${total}`}
        subtitle={form.title || form.date_text}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />

      <StoryDateTextPicker
        value={form.date_text}
        onChange={(date_text) => setForm({ ...form, date_text })}
      />
      <Input
        placeholder="O que aconteceu?"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Input
        placeholder="Local (opcional)"
        value={form.place || ""}
        onChange={(e) => setForm({ ...form, place: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Textarea
        placeholder="Conte os detalhes..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="min-h-[100px] bg-white/5 rounded-xl border-white/5"
      />

      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
          Ícone
        </span>
        <IconPicker
          value={form.icon_name ?? "Sparkles"}
          onChange={(icon_name) => setForm({ ...form, icon_name })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MediaUpload
          type="image"
          currentUrl={form.image_url ?? undefined}
          onUpload={(url) => setForm({ ...form, image_url: url })}
        />
        <MediaUpload
          type="video"
          currentUrl={form.video_url ?? undefined}
          onUpload={(url) => setForm({ ...form, video_url: url })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`timeline-video-${ev.id}`} className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
          Link do vídeo (YouTube, Vimeo ou MP4)
        </label>
        <Input
          id={`timeline-video-${ev.id}`}
          placeholder="https://youtube.com/watch?v=... ou cole o link do upload"
          value={form.video_url ?? ""}
          onChange={(e) => setForm({ ...form, video_url: e.target.value || null })}
          className="bg-white/5 rounded-xl border-white/5 font-mono text-xs"
        />
        {form.video_url && (
          <div className="pt-2">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Prévia do vídeo
            </p>
            <StoryVideoPlayer url={form.video_url} title={form.title} clickToPlay={false} />
          </div>
        )}
      </div>

      <AdminOrderActions
        onSave={save}
        onRemove={remove}
        saving={saving}
        position={position}
      />
    </AdminOrderableShell>
  );
}

/* -------------------- Stats -------------------- */
function StatsEditor() {
  const { data, isLoading } = useStats();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["stats"] });
  const sorted = useMemo(() => sortByOrder(data ?? []), [data]);

  async function add() {
    const { error } = await supabase.from("stats").insert({
      icon: "✨",
      icon_name: "Sparkles",
      label: "novo",
      value: "0",
      sort_order: nextSortOrder(sorted),
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function moveStat(id: string, direction: "up" | "down") {
    const next = swapInList(sorted, id, direction);
    if (!next) return;
    try {
      await persistTableOrder("stats", next);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-4">
      <AdminOrderHint>
        <p>
          A ordem aqui é <span className="text-foreground">esquerda → direita</span> nos números do
          site. Use as setas em cada card.
        </p>
      </AdminOrderHint>
      <AdminOrderableGrid>
        {sorted.map((s, index) => (
          <StatRow
            key={s.id}
            s={s}
            position={index + 1}
            total={sorted.length}
            onMoveUp={() => void moveStat(s.id, "up")}
            onMoveDown={() => void moveStat(s.id, "down")}
            onChange={refresh}
          />
        ))}
      </AdminOrderableGrid>
      <Button onClick={add} variant="outline" className="w-full border-dashed rounded-xl py-8">
        <Plus className="h-4 w-4" /> Adicionar estatística
      </Button>
    </div>
  );
}

function StatRow({
  s,
  position,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  s: Stat;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(s);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(s);
  }, [s]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("stats")
      .update({
        icon: form.icon,
        icon_name: form.icon_name,
        label: form.label,
        value: form.value,
      })
      .eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("stats");
      onChange();
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remover?")) return;
    const { error } = await supabase.from("stats").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  return (
    <AdminOrderableShell>
      <AdminOrderHeader
        position={position}
        total={total}
        title={`Estatística ${position} de ${total}`}
        subtitle={form.label || "Sem rótulo"}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      <Input
        placeholder="Rótulo"
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Input
        placeholder="Valor (ex: incontáveis)"
        value={form.value}
        onChange={(e) => setForm({ ...form, value: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
          Ícone
        </span>
        <IconPicker
          value={form.icon_name ?? "Sparkles"}
          onChange={(icon_name) => setForm({ ...form, icon_name })}
        />
      </div>
      <AdminOrderActions
        onSave={save}
        onRemove={remove}
        saving={saving}
        position={position}
      />
    </AdminOrderableShell>
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
        music_url: form.music_url,
        ending_audio_url: form.ending_audio_url,
        print_card_tagline: form.print_card_tagline,
        print_card_scan_line: form.print_card_scan_line,
        print_card_back_message: form.print_card_back_message,
        theme_mode: form.theme_mode,
        page_gate_enabled: form.page_gate_enabled,
        access_date: form.access_date,
      })
      .eq("id", 1);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("settings");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    }
    setSaving(false);
  }

  const gateDate =
    form.access_date ??
    (() => {
      const d = parseStoryDate(form.relationship_start);
      return d ? toDateOnlyString(d) : form.relationship_start.slice(0, 10);
    })();

  return (
    <div className="glass space-y-6 rounded-2xl p-6">
      <div className="space-y-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <Shield className="h-5 w-5 text-accent" /> Proteção da página
          </h3>
          <p className="text-xs text-muted-foreground">
            Quem não souber a data especial não consegue ver a história.
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label htmlFor="page-gate">Exigir senha para entrar</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              A senha é a data no formato <span className="font-mono">DDMMYYYY</span>
            </p>
          </div>
          <Switch
            id="page-gate"
            checked={form.page_gate_enabled}
            onCheckedChange={(page_gate_enabled) => setForm({ ...form, page_gate_enabled })}
          />
        </div>
        {form.page_gate_enabled && (
          <div className="space-y-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/5">
            <label htmlFor="access-date" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
              Nosso dia (data da senha)
            </label>
            <StoryDatePicker
              variant="compact"
              value={gateDate}
              onChange={(access_date) => setForm({ ...form, access_date })}
              placeholder="Escolher nosso dia"
            />
            <GatePasswordPreview dateValue={gateDate} />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex-1 space-y-1">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <Palette className="h-5 w-5 text-accent" /> Estilo Visual
          </h3>
          <p className="text-xs text-muted-foreground">Escolha como a história será apresentada.</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, theme_mode: "romantic" })}
            className={`rounded-lg px-4 py-2 text-xs transition-all cursor-pointer ${
              form.theme_mode !== "soft-rose"
                ? "bg-primary shadow-glow"
                : "hover:bg-white/5"
            }`}
          >
            Romantic Deep
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, theme_mode: "soft-rose" })}
            className={`rounded-lg px-4 py-2 text-xs transition-all cursor-pointer ${
              form.theme_mode === "soft-rose"
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
          <label htmlFor="her-name" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Nome dela
          </label>
          <Input
            value={form.her_name}
            onChange={(e) => setForm({ ...form, her_name: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="relationship-start" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Início do relacionamento
          </label>
          <StoryDatePicker
            mode="datetime"
            value={form.relationship_start}
            onChange={(relationship_start) =>
              setForm({ ...form, relationship_start: relationship_start ?? form.relationship_start })
            }
            placeholder="Quando tudo começou"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="love-letter" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
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
        <label htmlFor="final-message" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
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
        <label htmlFor="secret-message" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Segredo (easter eggs)
        </label>
        <Textarea
          rows={2}
          value={form.secret_message}
          onChange={(e) => setForm({ ...form, secret_message: e.target.value })}
          className="bg-white/5 rounded-xl border-white/5"
        />
      </div>
      <div className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div>
          <h4 className="font-display text-lg">Cartão para impressão (QR)</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Textos usados na frente e no verso do cartão A6.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="print-card-tagline" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Subtítulo da frente
          </label>
          <Input
            id="print-card-tagline"
            value={form.print_card_tagline}
            onChange={(e) => setForm({ ...form, print_card_tagline: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="print-card-scan" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Texto abaixo do QR
          </label>
          <Input
            id="print-card-scan"
            value={form.print_card_scan_line}
            onChange={(e) => setForm({ ...form, print_card_scan_line: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="print-card-back" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
            Mensagem do verso
          </label>
          <Textarea
            id="print-card-back"
            rows={4}
            value={form.print_card_back_message}
            onChange={(e) => setForm({ ...form, print_card_back_message: e.target.value })}
            className="bg-white/5 rounded-xl border-white/5 min-h-[100px]"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="ending-audio-url" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Áudio da última surpresa
        </label>
        <p className="text-xs text-muted-foreground ml-1">
          Toca no final cinematográfico, quando ela clicar em &quot;Uma última surpresa&quot;.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Input
              id="ending-audio-url"
              placeholder="URL do áudio ou faça upload ->"
              value={form.ending_audio_url}
              onChange={(e) => setForm({ ...form, ending_audio_url: e.target.value })}
              className="bg-white/5 rounded-xl border-white/5"
            />
          </div>
          <MediaUpload
            type="audio"
            onUpload={(url) => setForm({ ...form, ending_audio_url: url })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="music-url" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
          Nossa Música (URL do áudio)
        </label>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Input
              placeholder="URL do MP3 ou faça upload ->"
              value={form.music_url}
              onChange={(e) => setForm({ ...form, music_url: e.target.value })}
              className="bg-white/5 rounded-xl border-white/5"
            />
          </div>
          <MediaUpload type="audio" onUpload={(url) => setForm({ ...form, music_url: url })} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="hidden-video-url" className="text-xs uppercase tracking-wider text-muted-foreground ml-1">
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

function DbSetupHint({ table }: { table: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-5 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Tabela não encontrada no banco</p>
      <p className="mt-2">
        Rode a migration <code className="text-xs">20260610000008_dynamic_content_and_gate.sql</code> no
        Supabase, ou execute <code className="text-xs">supabase db push</code>.
      </p>
      <p className="mt-1 text-xs opacity-70">Tabela: {table}</p>
    </div>
  );
}

/* -------------------- Places -------------------- */
function PlacesEditor() {
  const { data, isLoading, isError, error } = usePlaces();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["places"] });
  const [seeding, setSeeding] = useState(false);
  const sorted = useMemo(() => sortByOrder(data ?? []), [data]);

  async function add() {
    const { error } = await supabase.from("places").insert({
      icon: "📍",
      icon_name: "MapPin",
      title: "Novo lugar",
      subtitle: "Descrição curta",
      sort_order: nextSortOrder(sorted),
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function movePlace(id: string, direction: "up" | "down") {
    const next = swapInList(sorted, id, direction);
    if (!next) return;
    try {
      await persistTableOrder("places", next);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  async function seedDefaults() {
    setSeeding(true);
    const { error } = await supabase.from("places").insert([...SEED_PLACES]);
    setSeeding(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Lugares de exemplo carregados");
      refresh();
    }
  }

  if (isLoading) return <Loader />;
  if (isError) {
    return (
      <div className="space-y-4">
        <DbSetupHint table="places" />
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const empty = (data ?? []).length === 0;

  return (
    <div className="space-y-4">
      <AdminOrderHint>
        <p className="font-medium text-foreground">Capítulo 04 — Nossos lugares</p>
        <p className="mt-1">
          Cards na página pública com lugares especiais. Use as setas em cada card para definir a
          ordem.
        </p>
      </AdminOrderHint>
      {empty && (
        <div className="glass rounded-2xl p-6 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum lugar cadastrado ainda.</p>
          <Button onClick={seedDefaults} disabled={seeding} className="mt-4 rounded-xl">
            {seeding ? "Carregando..." : "Carregar exemplos"}
          </Button>
        </div>
      )}
      <AdminOrderableGrid>
        {sorted.map((p, index) => (
          <PlaceRow
            key={p.id}
            p={p}
            position={index + 1}
            total={sorted.length}
            onMoveUp={() => void movePlace(p.id, "up")}
            onMoveDown={() => void movePlace(p.id, "down")}
            onChange={refresh}
          />
        ))}
      </AdminOrderableGrid>
      <Button onClick={add} variant="outline" className="w-full border-dashed rounded-xl py-8">
        <Plus className="h-4 w-4" /> <MapPin className="h-4 w-4" /> Adicionar lugar
      </Button>
    </div>
  );
}

function PlaceRow({
  p,
  position,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  p: Place;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(p);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(p);
  }, [p]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("places")
      .update({
        icon_name: form.icon_name,
        title: form.title,
        subtitle: form.subtitle,
      })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("places");
      onChange();
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remover este lugar?")) return;
    const { error } = await supabase.from("places").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  return (
    <AdminOrderableShell>
      <AdminOrderHeader
        position={position}
        total={total}
        title={`Lugar ${position} de ${total}`}
        subtitle={form.title || "Sem título"}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      <Input
        placeholder="Título"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Input
        placeholder="Subtítulo"
        value={form.subtitle}
        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
          Ícone
        </span>
        <IconPicker
          value={form.icon_name ?? "MapPin"}
          onChange={(icon_name) => setForm({ ...form, icon_name })}
        />
      </div>
      <AdminOrderActions
        onSave={save}
        onRemove={remove}
        saving={saving}
        position={position}
      />
    </AdminOrderableShell>
  );
}

/* -------------------- Memories -------------------- */
/* -------------------- Love Notes -------------------- */
function LoveNotesEditor() {
  const { data, isLoading } = useLoveNotes();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["love_notes"] });
  const sorted = useMemo(() => sortByOrder(data ?? []), [data]);

  async function add() {
    const { error } = await supabase.from("love_notes").insert({
      text: "Nova mensagem...",
      sort_order: nextSortOrder(sorted),
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function moveNote(id: string, direction: "up" | "down") {
    const next = swapInList(sorted, id, direction);
    if (!next) return;
    try {
      await persistTableOrder("love_notes", next);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  if (isLoading) return <Loader />;
  return (
    <div className="space-y-4">
      <AdminOrderHint>
        <p className="font-medium text-foreground">Mural de mensagens</p>
        <p className="mt-1">
          Pequenas coisas que você ama — aparecem em colunas no site. Use as setas para ordenar.
        </p>
      </AdminOrderHint>
      <AdminOrderableGrid>
        {sorted.map((note, index) => (
          <LoveNoteRow
            key={note.id}
            note={note}
            position={index + 1}
            total={sorted.length}
            onMoveUp={() => void moveNote(note.id, "up")}
            onMoveDown={() => void moveNote(note.id, "down")}
            onChange={refresh}
          />
        ))}
      </AdminOrderableGrid>
      <Button onClick={add} variant="outline" className="w-full border-dashed rounded-xl py-8">
        <Plus className="h-4 w-4" /> Adicionar mensagem
      </Button>
    </div>
  );
}

function LoveNoteRow({
  note,
  position,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  note: LoveNote;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(note);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(note);
  }, [note]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("love_notes")
      .update({ text: form.text })
      .eq("id", note.id);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("notes");
      onChange();
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remover esta mensagem?")) return;
    const { error } = await supabase.from("love_notes").delete().eq("id", note.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  const preview =
    form.text.length > 48 ? `${form.text.slice(0, 48).trim()}…` : form.text || "Nova mensagem";

  return (
    <AdminOrderableShell>
      <AdminOrderHeader
        position={position}
        total={total}
        title={`Mensagem ${position} de ${total}`}
        subtitle={preview}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      <Textarea
        rows={2}
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5 font-script text-lg"
      />
      <AdminOrderActions
        onSave={save}
        onRemove={remove}
        saving={saving}
        position={position}
      />
    </AdminOrderableShell>
  );
}

function MemoriesEditor() {
  const { data, isLoading, isError, error } = useMemoryEnvelopes();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["memory_envelopes"] });
  const [seeding, setSeeding] = useState(false);
  const sorted = useMemo(() => sortByOrder(data ?? []), [data]);

  async function add() {
    const { error } = await supabase.from("memory_envelopes").insert({
      icon: "💌",
      icon_name: "Mail",
      title: "Novo envelope",
      message: "Sua mensagem especial aqui...",
      is_easter_egg: false,
      sort_order: nextSortOrder(sorted),
    });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function moveMemory(id: string, direction: "up" | "down") {
    const next = swapInList(sorted, id, direction);
    if (!next) return;
    try {
      await persistTableOrder("memory_envelopes", next);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  async function seedDefaults() {
    setSeeding(true);
    const { error } = await supabase.from("memory_envelopes").insert([...SEED_MEMORY_ENVELOPES]);
    setSeeding(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Envelopes de exemplo carregados");
      refresh();
    }
  }

  if (isLoading) return <Loader />;
  if (isError) {
    return (
      <div className="space-y-4">
        <DbSetupHint table="memory_envelopes" />
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const empty = (data ?? []).length === 0;

  return (
    <div className="space-y-4">
      <AdminOrderHint>
        <p className="font-medium text-foreground">Capítulo 08 — Caixa de memórias</p>
        <p className="mt-1">
          Envelopes que a pessoa toca para abrir mensagens curtas. Use as setas para ordenar. O
          coração com <strong>?</strong> no site é o easter egg fixo (5 toques).
        </p>
      </AdminOrderHint>
      {empty && (
        <div className="glass rounded-2xl p-6 text-center">
          <Mail className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum envelope cadastrado ainda.</p>
          <Button onClick={seedDefaults} disabled={seeding} className="mt-4 rounded-xl">
            {seeding ? "Carregando..." : "Carregar exemplos"}
          </Button>
        </div>
      )}
      <AdminOrderableGrid>
        {sorted.map((m, index) => (
          <MemoryRow
            key={m.id}
            m={m}
            position={index + 1}
            total={sorted.length}
            onMoveUp={() => void moveMemory(m.id, "up")}
            onMoveDown={() => void moveMemory(m.id, "down")}
            onChange={refresh}
          />
        ))}
      </AdminOrderableGrid>
      <Button onClick={add} variant="outline" className="w-full border-dashed rounded-xl py-8">
        <Plus className="h-4 w-4" /> <Mail className="h-4 w-4" /> Adicionar envelope
      </Button>
    </div>
  );
}

function MemoryRow({
  m,
  position,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  m: MemoryEnvelope;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(m);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(m);
  }, [m]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("memory_envelopes")
      .update({
        icon_name: form.icon_name,
        title: form.title,
        message: form.message,
        is_easter_egg: form.is_easter_egg,
        is_locked: form.is_locked,
        unlock_at: form.unlock_at || null,
      })
      .eq("id", m.id);
    if (error) toast.error(error.message);
    else {
      toastRomanticSave("memories");
      onChange();
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remover este envelope?")) return;
    const { error } = await supabase.from("memory_envelopes").delete().eq("id", m.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  return (
    <AdminOrderableShell className={form.is_easter_egg ? "ring-1 ring-accent/40" : ""}>
      <AdminOrderHeader
        position={position}
        total={total}
        title={`Envelope ${position} de ${total}`}
        subtitle={form.title || "Sem título"}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      {form.is_easter_egg && (
        <p className="flex items-center gap-2 text-xs text-accent">
          <Heart className="h-3.5 w-3.5 fill-accent" /> Easter egg — não aparece na grade principal
        </p>
      )}
      <Input
        placeholder="Título do envelope"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <Textarea
        rows={3}
        placeholder="Mensagem ao abrir"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="bg-white/5 rounded-xl border-white/5"
      />
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
          Ícone
        </span>
        <IconPicker
          value={form.icon_name ?? "Mail"}
          onChange={(icon_name) => setForm({ ...form, icon_name })}
        />
      </div>
      {form.is_locked && (
        <Input
          type="datetime-local"
          value={form.unlock_at ? form.unlock_at.slice(0, 16) : ""}
          onChange={(e) =>
            setForm({
              ...form,
              unlock_at: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          className="bg-white/5 rounded-xl border-white/5"
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
          <Switch
            id={`easter-${m.id}`}
            checked={form.is_easter_egg}
            onCheckedChange={(is_easter_egg) => setForm({ ...form, is_easter_egg })}
          />
          <Label htmlFor={`easter-${m.id}`} className="text-sm">
            Easter egg
          </Label>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
          <Switch
            id={`locked-${m.id}`}
            checked={form.is_locked}
            onCheckedChange={(is_locked) => setForm({ ...form, is_locked })}
          />
          <Label htmlFor={`locked-${m.id}`} className="text-sm">
            Bloqueado
          </Label>
        </div>
      </div>
      <AdminOrderActions
        onSave={save}
        onRemove={remove}
        saving={saving}
        position={position}
      />
    </AdminOrderableShell>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
