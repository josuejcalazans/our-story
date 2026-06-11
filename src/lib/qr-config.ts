
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
  const hasLogo = Boolean(options.logoUrl);
  const logoSize = options.logoSize ?? 50;

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
    // Always set imageOptions (never undefined) so update() does not crash.
    // imageSize must always be a number — omitting it becomes NaN inside qr-code-styling.
    image: hasLogo ? options.logoUrl : undefined,
    imageOptions: hasLogo
      ? {
          crossOrigin: "anonymous",
          margin: 4,
          imageSize: logoSize / options.size,
          hideBackgroundDots: options.logoExcavate ?? true,
        }
      : {
          hideBackgroundDots: options.logoExcavate ?? true,
          imageSize: 0.4,
          margin: 0,
        },
  };
}
