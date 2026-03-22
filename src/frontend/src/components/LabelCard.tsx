import { useMemo } from "react";
import type { BarcodeFormat } from "../lib/barcode";
import { encodeBarcode, modulesToSVG } from "../lib/barcode";
import type { LabelTemplate, WarehouseLocation } from "../lib/labelTemplates";

export interface LabelStyleProps {
  barColor?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  showText?: boolean;
  textPosition?: "above" | "below";
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "none" | "solid" | "dashed" | "dotted";
}

interface LabelCardProps extends LabelStyleProps {
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
  barColor = "#000000",
}: {
  value: string;
  format: BarcodeFormat;
  height?: number;
  barColor?: string;
}) {
  const svgContent = useMemo(() => {
    if (!value) return null;
    const modules = encodeBarcode(value, format);
    if (!modules) return null;
    const svg = modulesToSVG(modules, height);
    // Apply bar color by replacing fill attributes
    return svg
      .replace(/fill="#?[0-9a-fA-F]{3,6}"/g, `fill="${barColor}"`)
      .replace(/fill="black"/g, `fill="${barColor}"`);
  }, [value, format, height, barColor]);

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
  barColor = "#000000",
  bgColor = "#ffffff",
  textColor = "#000000",
  fontSize = 10,
  fontFamily = "monospace",
  showText = true,
  textPosition = "below",
  borderColor = "#cccccc",
  borderWidth = 1,
  borderStyle = "solid",
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
    backgroundColor: bgColor,
    border:
      borderStyle === "none"
        ? "none"
        : `${borderWidth}px ${borderStyle} ${borderColor}`,
    color: textColor,
    fontFamily,
    fontSize: `${fontSize}pt`,
  };

  const baseClass = "overflow-hidden flex flex-col barcode-card-print";

  const textEl = showText ? (
    <div
      className="text-center truncate px-0.5"
      style={{
        color: textColor,
        fontFamily,
        fontSize: `${fontSize * 0.5}pt`,
        paddingBottom: "1px",
      }}
    >
      {value}
    </div>
  ) : null;

  if (template === "warehouse") {
    return (
      <div style={baseStyle} className={`${baseClass} ${className}`}>
        {isSmall ? (
          <>
            <div className="flex-1 flex items-center justify-center px-1 pt-1 min-h-0">
              <BarcodeSVGInline
                value={value}
                format={format}
                height={40}
                barColor={barColor}
              />
            </div>
            {loc?.bin && (
              <div
                className="text-center font-mono font-bold leading-tight px-0.5 pb-0.5"
                style={{ fontSize: "6px", color: textColor }}
              >
                BIN: {loc.bin}
              </div>
            )}
          </>
        ) : (
          <>
            {loc && (loc.zone || loc.aisle || loc.rack || loc.bin) && (
              <div
                className="grid grid-cols-2 shrink-0"
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  fontSize: "7px",
                }}
              >
                {[
                  { label: "ZONE", val: loc.zone },
                  { label: "AISLE", val: loc.aisle },
                  { label: "RACK", val: loc.rack },
                  { label: "BIN", val: loc.bin },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center px-1 py-0.5"
                    style={{
                      borderRight:
                        label === "ZONE" || label === "RACK"
                          ? `1px solid ${borderColor}`
                          : undefined,
                    }}
                  >
                    <span
                      className="font-mono leading-tight"
                      style={{
                        fontSize: "5px",
                        color: textColor,
                        opacity: 0.6,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className="font-mono font-bold leading-tight"
                      style={{ fontSize: "8px", color: textColor }}
                    >
                      {val || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center px-1 pt-0.5 min-h-0">
              <BarcodeSVGInline
                value={value}
                format={format}
                height={45}
                barColor={barColor}
              />
            </div>
            {showText && (
              <div
                className="text-center font-mono pb-0.5 px-0.5 truncate"
                style={{ fontSize: "5px", color: textColor }}
              >
                {value}
              </div>
            )}
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
        {showText && textPosition === "above" && (
          <div
            className="text-center font-mono font-semibold pt-0.5 tracking-wider"
            style={{ fontSize: "6px", color: textColor }}
          >
            {displayValue}
          </div>
        )}
        <div className="flex-1 flex items-center justify-center px-1 pt-1 min-h-0 w-full">
          <BarcodeSVGInline
            value={value}
            format={format}
            height={50}
            barColor={barColor}
          />
        </div>
        {showText && textPosition !== "above" && (
          <div
            className="text-center font-mono font-semibold pb-0.5 tracking-wider"
            style={{ fontSize: "6px", color: textColor }}
          >
            {displayValue}
          </div>
        )}
      </div>
    );
  }

  if (template === "price") {
    return (
      <div
        style={baseStyle}
        className={`${baseClass} items-center justify-between ${className}`}
      >
        {showText && textPosition === "above" && (
          <div
            className="text-center font-mono font-bold pt-0.5 w-full truncate"
            style={{
              fontSize: "7px",
              letterSpacing: "0.05em",
              color: textColor,
            }}
          >
            {value}
          </div>
        )}
        <div className="flex-1 flex items-center justify-center px-1 min-h-0 w-full">
          <BarcodeSVGInline
            value={value}
            format={format}
            height={45}
            barColor={barColor}
          />
        </div>
        {showText && textPosition !== "above" && (
          <div
            className="text-center font-mono font-bold pb-0.5 tracking-widest"
            style={{ fontSize: "5px", color: textColor }}
          >
            ▶ SCAN ◀
          </div>
        )}
      </div>
    );
  }

  // Standard
  return (
    <div style={baseStyle} className={`${baseClass} items-center ${className}`}>
      {showText && textPosition === "above" && textEl}
      <div className="flex-1 flex items-center justify-center px-1 pt-1 min-h-0 w-full">
        <BarcodeSVGInline
          value={value}
          format={format}
          height={55}
          barColor={barColor}
        />
      </div>
      {showText && textPosition !== "above" && textEl}
    </div>
  );
}
