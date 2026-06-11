
import type { CornerDotType, CornerSquareType, DotType } from "@/lib/qr-styles";

type StyleCategory = "dot" | "cornerSquare" | "cornerDot";

type QRStyleIconProps = {
  category: StyleCategory;
  style: DotType | CornerSquareType | CornerDotType;
};

function DotModule({ type }: { type: DotType }) {
  const fill = "currentColor";
  switch (type) {
    case "dots":
      return <circle cx="12" cy="12" r="3.5" fill={fill} />;
    case "rounded":
      return <rect x="8" y="8" width="8" height="8" rx="2" fill={fill} />;
    case "extra-rounded":
      return <rect x="8" y="8" width="8" height="8" rx="4" fill={fill} />;
    case "classy":
      return <path d="M8 8h4v4H8zm4 4h4v4h-4z" fill={fill} />;
    case "classy-rounded":
      return (
        <path
          d="M8 8h4a2 2 0 0 1 2 2v2h-4a2 2 0 0 1-2-2zm4 4h4a2 2 0 0 1 2 2v2h-4a2 2 0 0 1-2-2z"
          fill={fill}
        />
      );
    default:
      return <rect x="8" y="8" width="8" height="8" fill={fill} />;
  }
}

function CornerSquareModule({ type }: { type: CornerSquareType }) {
  const fill = "currentColor";
  const outer = { x: 4, y: 4, w: 16, h: 16 };

  switch (type) {
    case "dot":
      return <circle cx="12" cy="12" r="8" fill="none" stroke={fill} strokeWidth="3" />;
    case "extra-rounded":
      return (
        <rect
          x={outer.x}
          y={outer.y}
          width={outer.w}
          height={outer.h}
          rx="6"
          fill="none"
          stroke={fill}
          strokeWidth="3"
        />
      );
    case "rounded":
      return (
        <rect
          x={outer.x}
          y={outer.y}
          width={outer.w}
          height={outer.h}
          rx="3"
          fill="none"
          stroke={fill}
          strokeWidth="3"
        />
      );
    default:
      return (
        <rect
          x={outer.x}
          y={outer.y}
          width={outer.w}
          height={outer.h}
          fill="none"
          stroke={fill}
          strokeWidth="3"
        />
      );
  }
}

function CornerDotModule({ type }: { type: CornerDotType }) {
  const fill = "currentColor";

  switch (type) {
    case "dot":
      return <circle cx="12" cy="12" r="5" fill={fill} />;
    default:
      return <rect x="7" y="7" width="10" height="10" fill={fill} />;
  }
}

const QRStyleIcon = ({ category, style }: QRStyleIconProps) => {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-foreground" aria-hidden="true">
      {category === "dot" && <DotModule type={style as DotType} />}
      {category === "cornerSquare" && <CornerSquareModule type={style as CornerSquareType} />}
      {category === "cornerDot" && <CornerDotModule type={style as CornerDotType} />}
    </svg>
  );
};

export default QRStyleIcon;
