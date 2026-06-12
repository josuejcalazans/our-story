import type { Options } from "qr-code-styling";
import type { ImageFitMode } from "./image-fit";
import type { DotType, CornerSquareType, CornerDotType } from "./qr-styles";

export type StyledQROptions = {
  data: string;
  /** Pixel size of the QR canvas being rendered */
  size: number;
  /** Preview/design QR size — logoSize is relative to this, not export size */
  designQrSize?: number;
  fgColor: string;
  bgColor: string;
  level: "L" | "M" | "Q" | "H";
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  logoUrl: string;
  /** Logo diameter on the design preview (px) */
  logoSize: number;
  logoExcavate: boolean;
  /** Original image for high-res reprocessing on export */
  logoRawSource?: string;
  logoFitMode?: ImageFitMode;
  logoFocalX?: number;
  logoFocalY?: number;
  logoZoom?: number;
};

export function logoImageFraction(options: StyledQROptions): number {
  const designSize = options.designQrSize ?? options.size;
  return Math.min(0.52, options.logoSize / Math.max(designSize, 1));
}

export function buildQRStylingConfig(options: StyledQROptions): Options {
  const hasLogo = Boolean(options.logoUrl);

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
      type: options.dotStyle as DotType,
    },
    cornersSquareOptions: {
      color: options.fgColor,
      type: options.cornerSquareStyle as CornerSquareType,
    },
    cornersDotOptions: {
      color: options.fgColor,
      type: options.cornerDotStyle as CornerDotType,
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
          margin: 2,
          imageSize: logoImageFraction(options),
          hideBackgroundDots: options.logoExcavate,
        }
      : {
          hideBackgroundDots: options.logoExcavate,
          imageSize: 0.4,
          margin: 0,
        },
  };
}
