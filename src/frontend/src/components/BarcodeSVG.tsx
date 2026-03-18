import { useMemo } from "react";
import {
  type BarcodeFormat,
  encodeBarcode,
  modulesToSVG,
} from "../lib/barcode";

interface BarcodeSVGProps {
  value: string;
  format: BarcodeFormat;
  height?: number;
  className?: string;
}

export function BarcodeSVG({
  value,
  format,
  height = 80,
  className,
}: BarcodeSVGProps) {
  const svgContent = useMemo(() => {
    if (!value) return null;
    const modules = encodeBarcode(value, format);
    if (!modules) return null;
    return modulesToSVG(modules, height);
  }, [value, format, height]);

  if (!svgContent) {
    return (
      <div
        className={`flex items-center justify-center bg-red-950/30 border border-red-800 text-red-400 text-xs font-mono px-2 py-1 ${className ?? ""}`}
      >
        Invalid
      </div>
    );
  }

  return (
    <div
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled SVG
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
