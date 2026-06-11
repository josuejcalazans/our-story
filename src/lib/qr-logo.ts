export async function fetchLogoAsDataUrl(url: string): Promise<string> {
  const tryFetch = async (fetchUrl: string) => {
    const res = await fetch(fetchUrl, { mode: "cors" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) throw new Error("not image");
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  try {
    return await tryFetch(url);
  } catch {
    const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(
      url.replace(/^https?:\/\//, ""),
    )}`;
    return await tryFetch(proxied);
  }
}

export async function removeLogoBackground(
  logoDataUrl: string,
  threshold = 240,
): Promise<string> {
  const img = new window.Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("load failed"));
    img.src = logoDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] >= threshold && d[i + 1] >= threshold && d[i + 2] >= threshold) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
