
import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { buildQRStylingConfig, type StyledQROptions } from "@/lib/qr-config";

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

    const config = buildQRStylingConfig(options);

    container.innerHTML = "";
    qrRef.current = new QRCodeStyling(config);
    qrRef.current.append(container);
  }, [
    containerRef,
    options.data,
    options.size,
    options.fgColor,
    options.bgColor,
    options.level,
    options.dotStyle,
    options.cornerSquareStyle,
    options.cornerDotStyle,
    options.logoUrl,
    options.logoSize,
    options.logoExcavate,
  ]);

  return qrRef;
}
