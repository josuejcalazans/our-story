export type VideoSource =
  | { kind: "youtube"; embedUrl: string; id: string }
  | { kind: "vimeo"; embedUrl: string; id: string }
  | { kind: "file"; src: string };

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|v\/|live\/))([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  return match?.[1] ?? null;
}

export function parseVideoUrl(url: string | null | undefined): VideoSource | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const youtubeId = extractYouTubeId(trimmed);
  if (youtubeId) {
    return {
      kind: "youtube",
      id: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`,
    };
  }

  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      kind: "vimeo",
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`,
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: "file", src: trimmed };
  }

  return null;
}

export function isEmbeddableVideo(url: string | null | undefined) {
  return parseVideoUrl(url) !== null;
}

export function buildEmbedSrc(
  source: Extract<VideoSource, { kind: "youtube" | "vimeo" }>,
  { autoplay = false, origin }: { autoplay?: boolean; origin?: string } = {},
) {
  const params = new URLSearchParams();

  if (source.kind === "youtube") {
    params.set("rel", "0");
    params.set("modestbranding", "1");
    params.set("playsinline", "1");
    if (origin) params.set("origin", origin);
    if (autoplay) {
      params.set("autoplay", "1");
      params.set("mute", "1");
    }
    return `https://www.youtube.com/embed/${source.id}?${params.toString()}`;
  }

  params.set("title", "0");
  params.set("byline", "0");
  params.set("portrait", "0");
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("muted", "1");
  }
  return `https://player.vimeo.com/video/${source.id}?${params.toString()}`;
}

/** @deprecated use parseVideoUrl */
export function getEmbedUrl(url: string, autoplay = false) {
  const source = parseVideoUrl(url);
  if (!source) return "";
  if (source.kind === "file") return source.src;
  return buildEmbedSrc(source, { autoplay });
}
