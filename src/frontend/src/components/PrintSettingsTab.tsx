import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Info, Printer, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { PageSetup, PrintConfig } from "../contexts/AppContext";
import { LABEL_SIZE_PRESETS } from "../lib/labelTemplates";
import { LabelCard } from "./LabelCard";

const PRINTER_PRESETS: {
  value: string;
  label: string;
  description: string;
  paperSize?: string;
  labelPreset?: string;
  dpi?: number;
}[] = [
  {
    value: "generic",
    label: "Generic / Any Printer",
    description: "Works with any printer. Configure manually.",
  },
  {
    value: "tms244pro",
    label: "TMS 244 Pro",
    description: "Thermal, 57mm roll. 203 DPI.",
    paperSize: "Thermal57",
    labelPreset: "md",
    dpi: 203,
  },
  {
    value: "zebra_zd",
    label: "Zebra ZD Series",
    description: "Thermal label printer. 203 DPI.",
    paperSize: "4x6Label",
    labelPreset: "lg",
    dpi: 203,
  },
  {
    value: "dymo",
    label: "Dymo LabelWriter",
    description: "Thermal label printer. 300 DPI.",
    paperSize: "3x2Label",
    labelPreset: "sm",
    dpi: 300,
  },
  {
    value: "brother_ql",
    label: "Brother QL Series",
    description: "Thermal label printer. 300 DPI.",
    paperSize: "4x6Label",
    labelPreset: "lg",
    dpi: 300,
  },
  {
    value: "citizen_cls",
    label: "Citizen CL-S Series",
    description: "Thermal label printer. 203 DPI.",
    paperSize: "4x6Label",
    labelPreset: "lg",
    dpi: 203,
  },
  {
    value: "hp",
    label: "HP LaserJet / Inkjet",
    description: "Standard A4/Letter paper. 600 DPI.",
    paperSize: "A4",
    labelPreset: "md",
    dpi: 600,
  },
];

const PAPER_SIZE_MAP: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  Letter: { w: 216, h: 279 },
  Legal: { w: 216, h: 356 },
  "4x6Label": { w: 102, h: 152 },
  "3x2Label": { w: 76, h: 51 },
  Thermal57: { w: 57, h: 200 },
  Thermal62: { w: 62, h: 200 },
  Thermal80: { w: 80, h: 200 },
  Thermal100: { w: 100, h: 200 },
};

export function PrintSettingsTab() {
  const {
    printConfig,
    setPrintConfig,
    pageSetup,
    setPageSetup,
    settings,
    generator,
  } = useAppContext();
  const [showPreview, setShowPreview] = useState(false);
  const [includeText, setIncludeText] = useState(settings.showText);
  const [textPosition, setTextPosition] = useState<"above" | "below">(
    settings.textPosition,
  );

  const labelSize = (() => {
    if (generator.labelSizePreset === "custom")
      return {
        widthMm: generator.customWidth,
        heightMm: generator.customHeight,
      };
    return (
      LABEL_SIZE_PRESETS[
        generator.labelSizePreset as keyof typeof LABEL_SIZE_PRESETS
      ] ?? { widthMm: 57, heightMm: 32 }
    );
  })();

  function applyPreset(value: string) {
    const preset = PRINTER_PRESETS.find((p) => p.value === value);
    if (!preset) return;
    setPrintConfig({
      ...printConfig,
      printerPreset: value,
      dpi: preset.dpi ?? printConfig.dpi,
    });
    if (preset.paperSize) {
      const paper = PAPER_SIZE_MAP[preset.paperSize];
      if (paper)
        setPageSetup({
          ...pageSetup,
          paperSize: preset.paperSize,
          paperWidth: paper.w,
          paperHeight: paper.h,
        });
    }
  }

  // Apply @page CSS rule when page setup changes
  useEffect(() => {
    const w =
      pageSetup.orientation === "landscape"
        ? pageSetup.paperHeight
        : pageSetup.paperWidth;
    const h =
      pageSetup.orientation === "landscape"
        ? pageSetup.paperWidth
        : pageSetup.paperHeight;
    let styleEl = document.getElementById(
      "dynamic-print-style",
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-print-style";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${w}mm ${h}mm; margin: ${pageSetup.marginTop}mm ${pageSetup.marginRight}mm ${pageSetup.marginBottom}mm ${pageSetup.marginLeft}mm; }`;
  }, [pageSetup]);

  const selectedPreset = PRINTER_PRESETS.find(
    (p) => p.value === printConfig.printerPreset,
  );

  const previewBarcodes = generator.barcodes.slice(
    0,
    printConfig.printMode === "onePerPage" ? 4 : pageSetup.labelsPerPage,
  );

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-6 max-w-xl space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Printer Preset
            </h2>
            <Select
              value={printConfig.printerPreset}
              onValueChange={applyPreset}
            >
              <SelectTrigger data-ocid="print.select" className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRINTER_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div>
                      <div className="font-medium">{p.label}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPreset && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {selectedPreset.description}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Print Mode
            </h2>
            <ToggleGroup
              type="single"
              value={printConfig.printMode}
              onValueChange={(v) =>
                v &&
                setPrintConfig({
                  ...printConfig,
                  printMode: v as PrintConfig["printMode"],
                })
              }
              className="w-full"
            >
              <ToggleGroupItem
                value="normal"
                className="flex-1 text-xs"
                data-ocid="print.toggle"
              >
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem
                value="sheet"
                className="flex-1 text-xs"
                data-ocid="print.toggle"
              >
                Sheet Labels
              </ToggleGroupItem>
              <ToggleGroupItem
                value="onePerPage"
                className="flex-1 text-xs"
                data-ocid="print.toggle"
              >
                1 Per Page
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Copies per barcode</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={printConfig.copies}
                onChange={(e) =>
                  setPrintConfig({
                    ...printConfig,
                    copies: Number(e.target.value),
                  })
                }
                className="h-8 text-sm"
                data-ocid="print.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">DPI Setting</Label>
              <Select
                value={String(printConfig.dpi)}
                onValueChange={(v) =>
                  setPrintConfig({ ...printConfig, dpi: Number(v) })
                }
              >
                <SelectTrigger className="h-8 text-sm" data-ocid="print.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[72, 150, 203, 300, 600].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} DPI
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Text Options
            </h2>
            <div className="flex items-center gap-3">
              <Switch
                checked={includeText}
                onCheckedChange={setIncludeText}
                data-ocid="print.switch"
              />
              <Label className="text-sm">Include text below barcode</Label>
            </div>
            {includeText && (
              <div className="space-y-1.5">
                <Label className="text-xs">Text Position</Label>
                <ToggleGroup
                  type="single"
                  value={textPosition}
                  onValueChange={(v) =>
                    v && setTextPosition(v as "above" | "below")
                  }
                  className="w-48"
                >
                  <ToggleGroupItem
                    value="below"
                    className="flex-1 text-xs"
                    data-ocid="print.toggle"
                  >
                    Below
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="above"
                    className="flex-1 text-xs"
                    data-ocid="print.toggle"
                  >
                    Above
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </div>

          <Separator />

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Use your browser's native print dialog to select your printer. For
              thermal printers, set paper size to match your label roll width.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="flex-1"
              data-ocid="print.open_modal_button"
            >
              <ZoomIn className="w-4 h-4 mr-2" />
              Print Preview
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex-1"
              data-ocid="print.primary_button"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Print Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          data-ocid="print.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Preview
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {generator.barcodes.length} barcodes
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {generator.barcodes.length === 0 ? (
              <div
                className="flex items-center justify-center h-40 text-muted-foreground"
                data-ocid="print.empty_state"
              >
                <p className="text-sm">
                  No barcodes to preview. Generate barcodes first.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {printConfig.printMode === "onePerPage" ? (
                  generator.barcodes.map((v, i) => (
                    <div
                      key={String(i)}
                      className="border rounded-lg p-4 flex items-center justify-center bg-white"
                      style={{ minHeight: "200px" }}
                      data-ocid={`print.item.${i + 1}`}
                    >
                      <LabelCard
                        value={v}
                        format={generator.format}
                        template={generator.template}
                        widthMm={labelSize.widthMm}
                        heightMm={labelSize.heightMm}
                        warehouseLocation={
                          generator.template === "warehouse"
                            ? generator.warehouseLocation
                            : undefined
                        }
                        barColor={settings.barColor}
                        bgColor={settings.bgColor}
                        textColor={settings.textColor}
                        showText={includeText}
                        textPosition={textPosition}
                      />
                    </div>
                  ))
                ) : (
                  <div className="border rounded-lg p-6 bg-white">
                    <div className="flex flex-wrap gap-2 justify-start">
                      {previewBarcodes.map((v, i) => (
                        <LabelCard
                          key={String(i)}
                          value={v}
                          format={generator.format}
                          template={generator.template}
                          widthMm={labelSize.widthMm}
                          heightMm={labelSize.heightMm}
                          warehouseLocation={
                            generator.template === "warehouse"
                              ? generator.warehouseLocation
                              : undefined
                          }
                          barColor={settings.barColor}
                          bgColor={settings.bgColor}
                          textColor={settings.textColor}
                          showText={includeText}
                          textPosition={textPosition}
                          data-ocid={`print.item.${i + 1}`}
                        />
                      ))}
                    </div>
                    {generator.barcodes.length > previewBarcodes.length && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        +{generator.barcodes.length - previewBarcodes.length}{" "}
                        more barcodes on subsequent pages
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              data-ocid="print.cancel_button"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowPreview(false);
                setTimeout(() => window.print(), 100);
              }}
              data-ocid="print.confirm_button"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
