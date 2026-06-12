import { Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildEmbedSrc, parseVideoUrl } from "@/lib/video-embed";

type StoryVideoPlayerProps = {
  url: string;
  title?: string;
  /** Autoplay embeds (muted). Direct files use the native controls. */
  autoplay?: boolean;
  /** Wait for a tap before loading YouTube/Vimeo iframes. */
  clickToPlay?: boolean;
  /** Fill the parent box (e.g. full-bleed hidden video section). */
  fill?: boolean;
  className?: string;
};

export default function StoryVideoPlayer({
  url,
  title,
  autoplay = false,
  clickToPlay = false,
  fill = false,
  className = "",
}: StoryVideoPlayerProps) {
  const source = useMemo(() => parseVideoUrl(url), [url]);
  const [embedActive, setEmbedActive] = useState(!clickToPlay);
  const [fileError, setFileError] = useState(false);
  const [origin, setOrigin] = useState<string | undefined>();

  useEffect(() => {
    setEmbedActive(!clickToPlay);
    setFileError(false);
  }, [clickToPlay, url]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!source) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 px-4 text-center text-sm text-muted-foreground ${
          fill ? "h-full min-h-[12rem] w-full" : "aspect-video w-full"
        } ${className}`}
      >
        Link de vídeo inválido ou não suportado.
      </div>
    );
  }

  const shellClass = fill
    ? `story-video-shell relative h-full min-h-[12rem] w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg ${className}`
    : `story-video-shell relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg ${className}`;

  if (source.kind === "file") {
    return (
      <div className={shellClass}>
        {fileError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
            <p>Não foi possível carregar este vídeo.</p>
            <p className="text-xs opacity-70">
              Confira se o arquivo é MP4/WebM e se o upload foi feito com o tipo correto.
            </p>
          </div>
        ) : (
          <video
            key={source.src}
            src={source.src}
            controls
            playsInline
            preload="metadata"
            autoPlay={autoplay}
            muted={autoplay}
            className="h-full w-full bg-black object-contain"
            aria-label={title ?? "Vídeo"}
            onError={() => setFileError(true)}
          >
            <track kind="captions" label="Legendas indisponíveis" />
          </video>
        )}
      </div>
    );
  }

  const embedSrc = buildEmbedSrc(source, { autoplay, origin });

  if (!embedActive) {
    return (
      <button
        type="button"
        onClick={() => setEmbedActive(true)}
        className={`${shellClass} group cursor-pointer text-left`}
        aria-label={title ? `Assistir: ${title}` : "Assistir vídeo"}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--primary), transparent 60%), radial-gradient(circle at 70% 70%, var(--accent), transparent 60%), #160C28",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-md transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7 fill-white text-white" />
          </span>
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 text-sm text-white/90">
          Toque para carregar o vídeo
        </span>
      </button>
    );
  }

  return (
    <div className={shellClass}>
      <iframe
        key={embedSrc}
        src={embedSrc}
        title={title ?? "Vídeo"}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
