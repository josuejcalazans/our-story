import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { buildQRStylingConfig, type StyledQROptions } from "@/lib/qr-config";

async function waitForQRRender(hasLogo: boolean) {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  if (hasLogo) {
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
  }
}

export function useStyledQRCode(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: StyledQROptions,
) {
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!options.data.trim()) {
      container.innerHTML = "";
      qrRef.current = null;
      return;
    }

    let cancelled = false;

    const render = async () => {
      const config = buildQRStylingConfig(options);

      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(config);
        container.innerHTML = "";
        qrRef.current.append(container);
      } else {
        qrRef.current.update(config);
      }

      await waitForQRRender(Boolean(options.logoUrl));
      if (cancelled) return;
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [containerRef, options]);

  return qrRef;
}
