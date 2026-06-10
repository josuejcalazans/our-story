
import type { Options } from "qr-code-styling";
import type { DotType, CornerSquareType, CornerDotType } from "./qr-styles";

export type StyledQROptions = {
  data: string;
  size: number;
  fgColor: string;
  bgColor: string;
  level: "L" | "M" | "Q" | "H";
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  logoUrl?: string;
  logoSize?: number;
  logoExcavate?: boolean;
};

export function buildQRStylingConfig(options: StyledQROptions): Options {
  return {
    width: options.size,
    height: options.size,
    type: "canvas",
    data: options.data,
    margin: 0,
    qrOptions: {
      errorCorrectionLevel: options.level,
    },
    dotsOptions: {
      color: options.fgColor,
      type: options.dotStyle as any,
    },
    cornersSquareOptions: {
      color: options.fgColor,
      type: options.cornerSquareStyle as any,
    },
    cornersDotOptions: {
      color: options.fgColor,
      type: options.cornerDotStyle as any,
    },
    backgroundOptions: {
      color: options.bgColor,
    },
    image: options.logoUrl || undefined,
    imageOptions: options.logoUrl
      ? {
          crossOrigin: "anonymous",
          margin: 4,
          imageSize: (options.logoSize || 50) / options.size,
          hideBackgroundDots: options.logoExcavate ?? true,
        }
      : undefined,
  };
}
