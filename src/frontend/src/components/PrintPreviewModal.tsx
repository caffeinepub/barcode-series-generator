import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, X } from "lucide-react";
import { useRef, useState } from "react";
import type { BarcodeFormat } from "../lib/barcode";
import type {
  HangTagData,
  LabelTemplate,
  WarehouseLocation,
} from "../lib/labelTemplates";
import { printHTML } from "../utils/print";
import { LabelCard } from "./LabelCard";

export interface PrintItem {
  value: string;
  description?: string;
  photoDataUrl?: string;
}

interface PrintPreviewModalProps {
  open: boolean;
  onClose: () => void;
  items: PrintItem[];
  format: BarcodeFormat;
  template: LabelTemplate;
  warehouseLocation?: WarehouseLocation;
  hangTagData?: HangTagData;
  barcodeHeightMode?: "normal" | "large";
  widthMm: number;
  heightMm: number;
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

const PRINTER_PRESETS: {
  value: string;
  label: string;
  width: string;
  height: string;
  margins: string;
}[] = [
  {
    value: "a4",
    label: "A4 (210×297mm)",
    width: "210mm",
    height: "297mm",
    margins: "10mm",
  },
  {
    value: "letter",
    label: "Letter (8.5×11in)",
    width: "8.5in",
    height: "11in",
    margins: "10mm",
  },
  {
    value: "hangtag",
    label: "Hang Tag (50×80mm)",
    width: "50mm",
    height: "80mm",
    margins: "3mm",
  },
  {
    value: "tsc244",
    label: "TSC TTP-244 Pro (58×40mm)",
    width: "58mm",
    height: "40mm",
    margins: "2mm",
  },
  {
    value: "tms244",
    label: "TMS 244 Pro (57mm roll)",
    width: "57mm",
    height: "200mm",
    margins: "2mm",
  },
  {
    value: "zebra",
    label: "Zebra Label (62×40mm)",
    width: "62mm",
    height: "40mm",
    margins: "2mm",
  },
  {
    value: "dymo",
    label: "Dymo LabelWriter (89×36mm)",
    width: "89mm",
    height: "36mm",
    margins: "2mm",
  },
  {
    value: "custom",
    label: "Auto / Printer Default",
    width: "auto",
    height: "auto",
    margins: "5mm",
  },
];

export function PrintPreviewModal({
  open,
  onClose,
  items,
  format,
  template,
  warehouseLocation,
  hangTagData,
  barcodeHeightMode = "normal",
  widthMm,
  heightMm,
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
}: PrintPreviewModalProps) {
  const defaultPreset = template === "hangtag" ? "hangtag" : "a4";
  const [printerPreset, setPrinterPreset] = useState(defaultPreset);
  const [copies, setCopies] = useState(1);
  const [onePerPage, setOnePerPage] = useState(template === "hangtag");
  const printAreaRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const preset =
      PRINTER_PRESETS.find((p) => p.value === printerPreset) ??
      PRINTER_PRESETS[0];
    if (!printAreaRef.current) return;
    const html = printAreaRef.current.innerHTML;
    printHTML(html, preset.width, preset.height, preset.margins);
  }

  const expandedItems: PrintItem[] = [];
  for (const item of items) {
    for (let c = 0; c < copies; c++) {
      expandedItems.push(item);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      data-ocid="print.dialog"
    >
      <DialogContent
        className="max-w-4xl h-[90vh] flex flex-col"
        data-ocid="print.modal"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Print Preview
              <Badge variant="secondary">{items.length} labels</Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-ocid="print.close_button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Printer Preset
            </Label>
            <Select value={printerPreset} onValueChange={setPrinterPreset}>
              <SelectTrigger
                className="h-8 text-xs w-44"
                data-ocid="print.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRINTER_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Copies</Label>
            <input
              type="number"
              min={1}
              max={10}
              value={copies}
              onChange={(e) =>
                setCopies(Math.max(1, Math.min(10, Number(e.target.value))))
              }
              className="w-16 h-8 border border-input rounded px-2 text-xs bg-background"
              data-ocid="print.input"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onePerPage"
              checked={onePerPage}
              onChange={(e) => setOnePerPage(e.target.checked)}
              className="w-3 h-3"
              data-ocid="print.checkbox"
            />
            <Label
              htmlFor="onePerPage"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              One per page
            </Label>
          </div>
          <Button
            onClick={handlePrint}
            className="ml-auto"
            data-ocid="print.primary_button"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Now
          </Button>
        </div>

        {/* Preview Grid */}
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-4">
          <div
            ref={printAreaRef}
            className={
              onePerPage
                ? "flex flex-col gap-4 items-center"
                : "flex flex-wrap gap-3 justify-start"
            }
          >
            {expandedItems.slice(0, 60).map((item, i) => (
              <div
                key={`preview-${String(i)}`}
                className={`bg-white shadow rounded p-2 flex flex-col gap-1 ${onePerPage ? "w-full max-w-sm" : ""}`}
                style={onePerPage ? { pageBreakAfter: "always" } : {}}
                data-ocid={`print.item.${i + 1}`}
              >
                {item.photoDataUrl && (
                  <img
                    src={item.photoDataUrl}
                    alt="label"
                    className="w-full object-contain rounded"
                    style={{ maxHeight: "60px" }}
                  />
                )}
                <LabelCard
                  value={item.value}
                  format={format}
                  template={template}
                  widthMm={widthMm}
                  heightMm={heightMm}
                  warehouseLocation={warehouseLocation}
                  hangTagData={hangTagData}
                  barcodeHeightMode={barcodeHeightMode}
                  barColor={barColor}
                  bgColor={bgColor}
                  textColor={textColor}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  showText={showText}
                  textPosition={textPosition}
                  borderColor={borderColor}
                  borderWidth={borderWidth}
                  borderStyle={borderStyle}
                />
                {item.description && (
                  <p className="text-xs text-center text-gray-600 truncate px-1">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
            {expandedItems.length > 60 && (
              <div className="text-xs text-muted-foreground p-4">
                +{expandedItems.length - 60} more labels (will print all)
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
