import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { heicUrlToDisplayUrl, isHeicUrl } from "@/lib/prepare-upload-image";

export default function HeicSafeImage({
  src,
  alt,
  className,
  onBroken,
}: {
  src: string;
  alt: string;
  className?: string;
  onBroken?: () => void;
}) {
  const [displaySrc, setDisplaySrc] = useState(() => (isHeicUrl(src) ? null : src));
  const [loading, setLoading] = useState(isHeicUrl(src));
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      if (!src) {
        setBroken(true);
        setLoading(false);
        onBroken?.();
        return;
      }

      if (!isHeicUrl(src)) {
        setDisplaySrc(src);
        setLoading(false);
        setBroken(false);
        return;
      }

      setLoading(true);
      setBroken(false);
      setDisplaySrc(null);

      try {
        objectUrl = await heicUrlToDisplayUrl(src);
        if (!cancelled) {
          setDisplaySrc(objectUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setBroken(true);
          setLoading(false);
          onBroken?.();
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-white/5 text-muted-foreground ${className ?? ""}`}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (broken || !displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-white/5 px-2 text-center text-[10px] text-muted-foreground ${className ?? ""}`}
      >
        HEIC — use &quot;Corrigir HEIC&quot;
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => {
        setBroken(true);
        onBroken?.();
      }}
    />
  );
}
