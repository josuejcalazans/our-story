
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

    if (!qrRef?.current) {
      qrRef.current = new QRCodeStyling(config);
      container.innerHTML = "";
      qrRef.current.append(container);
    } else {
      qrRef.current.update(config);
    }
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
