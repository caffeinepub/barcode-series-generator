import { useMemo } from "react";
import type { BarcodeFormat } from "../lib/barcode";
import { encodeBarcode, modulesToSVG } from "../lib/barcode";
import type { LabelTemplate, WarehouseLocation } from "../lib/labelTemplates";

interface LabelCardProps {
  value: string;
  format: BarcodeFormat;
  template: LabelTemplate;
  widthMm: number;
  heightMm: number;
  warehouseLocation?: WarehouseLocation;
  className?: string;
}

function BarcodeSVGInline({
  value,
  format,
  height = 60,
}: {
  value: string;
  format: BarcodeFormat;
  height?: number;
}) {
  const svgContent = useMemo(() => {
    if (!value) return null;
    const modules = encodeBarcode(value, format);
    if (!modules) return null;
    return modulesToSVG(modules, height);
  }, [value, format, height]);

  if (!svgContent) {
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-300 text-red-500 text-xs font-mono px-1 py-0.5 w-full">
        Invalid
      </div>
    );
  }

  return (
    <div
      className="w-full label-card"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled SVG
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

function formatEANDisplay(value: string, format: BarcodeFormat): string {
  const digits = value.replace(/\D/g, "");
  if (format === "EAN13" && digits.length >= 12) {
    const d = digits.length === 13 ? digits : digits.padStart(13, "0");
    return `${d[0]} ${d.slice(1, 7)} ${d.slice(7)}`;
  }
  if (format === "EAN8" && digits.length >= 7) {
    const d = digits.length === 8 ? digits : digits.padStart(8, "0");
    return `${d.slice(0, 4)} ${d.slice(4)}`;
  }
  if (format === "UPCA" && digits.length >= 11) {
    return `${digits[0]} ${digits.slice(1, 6)} ${digits.slice(6, 11)} ${digits[11] ?? ""}`;
  }
  return value;
}

export function LabelCard({
  value,
  format,
  template,
  widthMm,
  heightMm,
  warehouseLocation,
  className = "",
}: LabelCardProps) {
  const loc = warehouseLocation;
  const isSmall = widthMm < 57;

  const baseStyle: React.CSSProperties = {
    width: `${widthMm}mm`,
    height: `${heightMm}mm`,
    minWidth: `${widthMm}mm`,
    minHeight: `${heightMm}mm`,
    maxWidth: `${widthMm}mm`,
    maxHeight: `${heightMm}mm`,
  };

  const baseClass =
    "bg-white border border-gray-300 print:border-gray-400 overflow-hidden flex flex-col barcode-card-print";

  if (template === "warehouse") {
    return (
      <div style={baseStyle} className={`${baseClass} ${className}`}>
        {isSmall ? (
          // Small: just barcode + bin
          <>
            <div className="flex-1 flex items-center justify-center px-1 pt-1 min-h-0">
              <BarcodeSVGInline value={value} format={format} height={40} />
            </div>
            {loc?.bin && (
              <div
                className="text-center font-mono font-bold text-gray-800 leading-tight px-0.5 pb-0.5"
                style={{ fontSize: "6px" }}
              >
                BIN: {loc.bin}
              </div>
            )}
          </>
        ) : (
          // Large: show location grid + barcode
          <>
            {loc && (loc.zone || loc.aisle || loc.rack || loc.bin) && (
              <div
                className="grid grid-cols-2 border-b border-gray-200 shrink-0"
                style={{ fontSize: "7px" }}
              >
                {[
                  { label: "ZONE", val: loc.zone },
                  { label: "AISLE", val: loc.aisle },
                  { label: "RACK", val: loc.rack },
                  { label: "BIN", val: loc.bin },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center border-gray-200 px-1 py-0.5"
                    style={{
                      borderRight:
                        label === "ZONE" || label === "RACK"
                          ? "1px solid #e5e7eb"
                          : undefined,
                    }}
                  >
                    <span
                      className="font-mono text-gray-400 leading-tight"
                      style={{ fontSize: "5px" }}
                    >
                      {label}
                    </span>
                    <span
                      className="font-mono font-bold text-gray-900 leading-tight"
                      style={{ fontSize: "8px" }}
                    >
                      {val || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center px-1 pt-0.5 min-h-0">
              <BarcodeSVGInline value={value} format={format} height={45} />
            </div>
            <div
              className="text-center font-mono text-gray-500 pb-0.5 px-0.5 truncate"
              style={{ fontSize: "5px" }}
            >
              {value}
            </div>
          </>
        )}
      </div>
    );
  }

  if (template === "ean") {
    const displayValue = formatEANDisplay(value, format);
    return (
      <div
        style={baseStyle}
        className={`${baseClass} items-center ${className}`}
      >
        <div className="flex-1 flex items-center justify-center px-1 pt-1 min-h-0 w-full">
          <BarcodeSVGInline value={value} format={format} height={50} />
        </div>
        <div
          className="text-center font-mono font-semibold text-gray-800 pb-0.5 tracking-wider"
          style={{ fontSize: "6px" }}
        >
          {displayValue}
        </div>
      </div>
    );
  }

  if (template === "price") {
    return (
      <div
        style={baseStyle}
        className={`${baseClass} items-center justify-between ${className}`}
      >
        <div
          className="text-center font-mono font-bold text-gray-900 pt-0.5 w-full truncate"
          style={{ fontSize: "7px", letterSpacing: "0.05em" }}
        >
          {value}
        </div>
        <div className="flex-1 flex items-center justify-center px-1 min-h-0 w-full">
          <BarcodeSVGInline value={value} format={format} height={45} />
        </div>
        <div
          className="text-center font-mono font-bold text-gray-500 pb-0.5 tracking-widest"
          style={{ fontSize: "5px" }}
        >
          ▶ SCAN ◀
        </div>
      </div>
    );
  }

  // Standard template
  return (
    <div style={baseStyle} className={`${baseClass} items-center ${className}`}>
      <div className="flex-1 flex items-center justify-center px-1 pt-1 min-h-0 w-full">
        <BarcodeSVGInline value={value} format={format} height={55} />
      </div>
      <div
        className="text-center font-mono text-gray-600 pb-0.5 px-0.5 truncate w-full"
        style={{ fontSize: "5px" }}
      >
        {value}
      </div>
    </div>
  );
}
