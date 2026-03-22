import { Button } from "@/components/ui/button";
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
import { useAppContext } from "../contexts/AppContext";

const PAPER_SIZES = [
  { value: "A4", label: "A4 (210×297mm)", w: 210, h: 297 },
  { value: "A5", label: "A5 (148×210mm)", w: 148, h: 210 },
  { value: "Letter", label: "Letter (216×279mm)", w: 216, h: 279 },
  { value: "Legal", label: "Legal (216×356mm)", w: 216, h: 356 },
  { value: "4x6Label", label: '4×6" Label (102×152mm)', w: 102, h: 152 },
  { value: "3x2Label", label: '3×2" Label (76×51mm)', w: 76, h: 51 },
  { value: "Thermal57", label: "Thermal Roll 57mm", w: 57, h: 200 },
  { value: "Thermal62", label: "Thermal Roll 62mm", w: 62, h: 200 },
  { value: "Thermal80", label: "Thermal Roll 80mm", w: 80, h: 200 },
  { value: "Thermal100", label: "Thermal Roll 100mm", w: 100, h: 200 },
  { value: "Custom", label: "Custom", w: 0, h: 0 },
];

const LABEL_SIZE_PRESETS = [
  { value: "xs", label: "XS", w: 25, h: 15 },
  { value: "sm", label: "Small", w: 38, h: 19 },
  { value: "md", label: "Medium", w: 57, h: 32 },
  { value: "lg", label: "Large", w: 102, h: 64 },
  { value: "custom", label: "Custom", w: 0, h: 0 },
];

function calcLabelsPerPage(
  pw: number,
  ph: number,
  lw: number,
  lh: number,
  mt: number,
  mb: number,
  ml: number,
  mr: number,
): number {
  const usableW = pw - ml - mr;
  const usableH = ph - mt - mb;
  const cols = Math.floor(usableW / lw);
  const rows = Math.floor(usableH / lh);
  return Math.max(1, cols * rows);
}

export function PageSetupTab() {
  const { pageSetup, setPageSetup } = useAppContext();

  const effectiveW =
    pageSetup.orientation === "landscape"
      ? pageSetup.paperHeight
      : pageSetup.paperWidth;
  const effectiveH =
    pageSetup.orientation === "landscape"
      ? pageSetup.paperWidth
      : pageSetup.paperHeight;

  const autoLabels = calcLabelsPerPage(
    effectiveW,
    effectiveH,
    pageSetup.labelWidth,
    pageSetup.labelHeight,
    pageSetup.marginTop,
    pageSetup.marginBottom,
    pageSetup.marginLeft,
    pageSetup.marginRight,
  );

  function selectPaper(value: string) {
    const paper = PAPER_SIZES.find((p) => p.value === value);
    if (!paper) return;
    const update: typeof pageSetup = { ...pageSetup, paperSize: value };
    if (value !== "Custom") {
      update.paperWidth = paper.w;
      update.paperHeight = paper.h;
    }
    setPageSetup(update);
  }

  function selectLabelSize(value: string) {
    const preset = LABEL_SIZE_PRESETS.find((p) => p.value === value);
    if (!preset) return;
    const update: typeof pageSetup = { ...pageSetup, labelSizePreset: value };
    if (value !== "custom") {
      update.labelWidth = preset.w;
      update.labelHeight = preset.h;
    }
    setPageSetup(update);
  }

  // Visual preview scale
  const previewScale = 200 / Math.max(effectiveW, effectiveH);
  const previewW = effectiveW * previewScale;
  const previewH = effectiveH * previewScale;
  const innerW =
    (effectiveW - pageSetup.marginLeft - pageSetup.marginRight) * previewScale;
  const innerH =
    (effectiveH - pageSetup.marginTop - pageSetup.marginBottom) * previewScale;
  const previewCols = Math.max(
    1,
    Math.floor(
      (effectiveW - pageSetup.marginLeft - pageSetup.marginRight) /
        pageSetup.labelWidth,
    ),
  );
  const previewRows = Math.max(
    1,
    Math.floor(
      (effectiveH - pageSetup.marginTop - pageSetup.marginBottom) /
        pageSetup.labelHeight,
    ),
  );

  return (
    <div className="flex h-full overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Paper / Media Size
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Paper Size</Label>
                <Select value={pageSetup.paperSize} onValueChange={selectPaper}>
                  <SelectTrigger
                    data-ocid="pagesetup.select"
                    className="h-8 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Orientation</Label>
                <ToggleGroup
                  type="single"
                  value={pageSetup.orientation}
                  onValueChange={(v) =>
                    v &&
                    setPageSetup({
                      ...pageSetup,
                      orientation: v as "portrait" | "landscape",
                    })
                  }
                  className="w-full"
                >
                  <ToggleGroupItem
                    value="portrait"
                    className="flex-1 h-8 text-xs"
                    data-ocid="pagesetup.toggle"
                  >
                    Portrait
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="landscape"
                    className="flex-1 h-8 text-xs"
                    data-ocid="pagesetup.toggle"
                  >
                    Landscape
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            {pageSetup.paperSize === "Custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Width (mm)</Label>
                  <Input
                    type="number"
                    value={pageSetup.paperWidth}
                    onChange={(e) =>
                      setPageSetup({
                        ...pageSetup,
                        paperWidth: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    data-ocid="pagesetup.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Height (mm)</Label>
                  <Input
                    type="number"
                    value={pageSetup.paperHeight}
                    onChange={(e) =>
                      setPageSetup({
                        ...pageSetup,
                        paperHeight: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    data-ocid="pagesetup.input"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Margins (mm)
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {(
                [
                  "marginTop",
                  "marginBottom",
                  "marginLeft",
                  "marginRight",
                ] as const
              ).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs">
                    {field.replace("margin", "")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={
                      (pageSetup as unknown as Record<string, number>)[field]
                    }
                    onChange={(e) =>
                      setPageSetup({
                        ...pageSetup,
                        [field]: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    data-ocid="pagesetup.input"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Label Size
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Label Preset</Label>
                <Select
                  value={pageSetup.labelSizePreset}
                  onValueChange={selectLabelSize}
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="pagesetup.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_SIZE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} {p.w ? `(${p.w}×${p.h}mm)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Labels Per Page</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    value={pageSetup.labelsPerPage}
                    onChange={(e) =>
                      setPageSetup({
                        ...pageSetup,
                        labelsPerPage: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm flex-1"
                    data-ocid="pagesetup.input"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs px-2"
                    onClick={() =>
                      setPageSetup({ ...pageSetup, labelsPerPage: autoLabels })
                    }
                    data-ocid="pagesetup.button"
                  >
                    Auto
                  </Button>
                </div>
              </div>
            </div>
            {pageSetup.labelSizePreset === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Label Width (mm)</Label>
                  <Input
                    type="number"
                    value={pageSetup.labelWidth}
                    onChange={(e) =>
                      setPageSetup({
                        ...pageSetup,
                        labelWidth: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    data-ocid="pagesetup.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Label Height (mm)</Label>
                  <Input
                    type="number"
                    value={pageSetup.labelHeight}
                    onChange={(e) =>
                      setPageSetup({
                        ...pageSetup,
                        labelHeight: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    data-ocid="pagesetup.input"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={pageSetup.onePerPage}
              onCheckedChange={(v) =>
                setPageSetup({ ...pageSetup, onePerPage: v })
              }
              data-ocid="pagesetup.switch"
            />
            <Label className="text-sm">One barcode per page</Label>
          </div>
        </div>
      </ScrollArea>

      {/* Visual Preview */}
      <div className="w-72 flex-shrink-0 border-l border-border bg-muted/20 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Page Preview
        </p>
        <div
          className="relative bg-white shadow-md"
          style={{ width: `${previewW}px`, height: `${previewH}px` }}
        >
          <div
            className="absolute border border-dashed border-blue-300"
            style={{
              left: `${pageSetup.marginLeft * previewScale}px`,
              top: `${pageSetup.marginTop * previewScale}px`,
              width: `${innerW}px`,
              height: `${innerH}px`,
            }}
          >
            <div
              className="grid h-full"
              style={{
                gridTemplateColumns: `repeat(${previewCols}, 1fr)`,
                gridTemplateRows: `repeat(${previewRows}, 1fr)`,
                gap: "1px",
              }}
            >
              {Array.from({ length: previewCols * previewRows }).map((_, i) => (
                <div
                  key={String(i)}
                  className="bg-gray-100 border border-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground space-y-0.5">
          <p>
            {effectiveW}×{effectiveH}mm
          </p>
          <p>{autoLabels} labels auto-calculated</p>
        </div>
      </div>
    </div>
  );
}
