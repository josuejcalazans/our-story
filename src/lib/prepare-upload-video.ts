import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { supabase } from "@/integrations/supabase/client";

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

export type VideoConvertProgress = {
  stage: "loading" | "converting";
  ratio: number;
};

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

async function getFfmpeg(onProgress?: (progress: VideoConvertProgress) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      onProgress?.({ stage: "converting", ratio: progress });
    });

    onProgress?.({ stage: "loading", ratio: 0 });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.worker.js`, "text/javascript"),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoadPromise;
}

export function isMovFile(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith(".mov") ||
    name.endsWith(".qt") ||
    type === "video/quicktime" ||
    type === "video/mov"
  );
}

export function isMovUrl(url: string | null | undefined) {
  if (!url?.trim()) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".mov") || path.endsWith(".qt");
  } catch {
    return /\.mov($|[?#])/i.test(url) || /\.qt($|[?#])/i.test(url);
  }
}

async function readOutputBlob(ffmpeg: FFmpeg, outputName: string): Promise<Blob> {
  const data = await ffmpeg.readFile(outputName);
  const bytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
  return new Blob([bytes as BlobPart], { type: "video/mp4" });
}

async function convertMovBlobToMp4(
  blob: Blob,
  sourceName = "video.mov",
  onProgress?: (progress: VideoConvertProgress) => void,
): Promise<Blob> {
  const ffmpeg = await getFfmpeg(onProgress);
  const inputName = "input.mov";
  const outputName = "output.mp4";

  await ffmpeg.writeFile(
    inputName,
    await fetchFile(
      new File([blob], sourceName, { type: blob.type || "video/quicktime" }),
    ),
  );

  // Remux rápido (sem perda) — funciona para H.264/AAC do iPhone
  let exitCode = await ffmpeg.exec([
    "-i",
    inputName,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  if (exitCode !== 0) {
    // Fallback: transcodifica para H.264/AAC (máxima compatibilidade no navegador)
    exitCode = await ffmpeg.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName,
    ]);
  }

  if (exitCode !== 0) {
    throw new Error("Não foi possível converter o vídeo MOV");
  }

  const mp4 = await readOutputBlob(ffmpeg, outputName);

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return mp4;
}

export async function prepareVideoForUpload(
  file: File,
  onProgress?: (progress: VideoConvertProgress) => void,
): Promise<File> {
  if (!isMovFile(file)) return file;

  const mp4Blob = await convertMovBlobToMp4(file, file.name, onProgress);
  const baseName = file.name.replace(/\.(mov|qt)$/i, "") || "video";

  return new File([mp4Blob], `${baseName}.mp4`, {
    type: "video/mp4",
    lastModified: file.lastModified,
  });
}

/** Baixa MOV do storage, converte e sobe MP4 — retorna a nova URL pública. */
export async function repairMovVideoUrl(
  movUrl: string,
  onProgress?: (progress: VideoConvertProgress) => void,
): Promise<string> {
  const response = await fetch(movUrl);
  if (!response.ok) {
    throw new Error("Não foi possível baixar o vídeo MOV");
  }

  const blob = await response.blob();
  const sourceName = movUrl.split("/").pop()?.split("?")[0] || "video.mov";
  const mp4 = await convertMovBlobToMp4(blob, sourceName, onProgress);
  const fileName = `${Math.random().toString(36).substring(2)}.mp4`;

  const { error } = await supabase.storage.from("assets").upload(fileName, mp4, {
    contentType: "video/mp4",
    cacheControl: "3600",
  });
  if (error) throw error;

  const { data } = supabase.storage.from("assets").getPublicUrl(fileName);
  return data.publicUrl;
}
