import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Save,
  ScanLine,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../contexts/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateSeries,
  useDeleteSeries,
  useListSeries,
} from "../hooks/useQueries";
import type { BarcodeFormat } from "../lib/barcode";
import type {
  LabelSizePreset,
  LabelTemplate,
  WarehouseLocation,
} from "../lib/labelTemplates";
import { LABEL_SIZE_PRESETS } from "../lib/labelTemplates";
import { LabelCard } from "./LabelCard";

const FORMAT_OPTIONS: { value: BarcodeFormat; label: string }[] = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
  { value: "EAN13", label: "EAN-13 (12-13 digits)" },
  { value: "UPCA", label: "UPC-A (11-12 digits)" },
  { value: "EAN8", label: "EAN-8 (7-8 digits)" },
  { value: "ITF14", label: "ITF-14 (13-14 digits)" },
];

const TEMPLATE_OPTIONS: { value: LabelTemplate; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "warehouse", label: "Warehouse Location" },
  { value: "ean", label: "EAN Retail" },
  { value: "price", label: "Price Label" },
];

const SIZE_OPTIONS: { value: LabelSizePreset; label: string }[] = [
  { value: "xs", label: "XS — 25×15mm" },
  { value: "sm", label: "Small — 38×19mm" },
  { value: "md", label: "Medium — 57×32mm" },
  { value: "lg", label: "Large — 102×64mm" },
  { value: "custom", label: "Custom" },
];

export function GeneratorTab() {
  const { settings, generator, setGenerator } = useAppContext();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const [configTab, setConfigTab] = useState("sequential");
  const [prefix, setPrefix] = useState("ITEM-");
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(20);
  const [step, setStep] = useState(1);
  const [padLength, setPadLength] = useState(4);
  const [customValues, setCustomValues] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState<WarehouseLocation>(
    { zone: "A", aisle: "1", rack: "2", bin: "3" },
  );
  const [seriesName, setSeriesName] = useState("");
  const [copiesPerBarcode, setCopiesPerBarcode] = useState(1);

  const { data: savedSeries } = useListSeries();
  const createMutation = useCreateSeries();
  const deleteMutation = useDeleteSeries();

  const labelSize = useMemo(() => {
    if (generator.labelSizePreset === "custom")
      return {
        widthMm: generator.customWidth,
        heightMm: generator.customHeight,
      };
    return (
      LABEL_SIZE_PRESETS[generator.labelSizePreset] ?? {
        widthMm: 57,
        heightMm: 32,
      }
    );
  }, [generator]);

  function generate() {
    let vals: string[] = [];
    if (configTab === "sequential") {
      for (let i = startNum; i <= endNum; i += step) {
        const numStr =
          padLength > 0 ? String(i).padStart(padLength, "0") : String(i);
        vals.push(`${prefix}${numStr}`);
      }
    } else {
      vals = customValues
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (vals.length === 0) {
      toast.error("No values to generate");
      return;
    }
    if (vals.length > 500) {
      toast.error("Maximum 500 barcodes at once");
      return;
    }
    const expanded: string[] = [];
    for (const v of vals)
      for (let c = 0; c < copiesPerBarcode; c++) expanded.push(v);
    setGenerator({ ...generator, barcodes: expanded });
    toast.success(
      `Generated ${expanded.length} barcode${expanded.length !== 1 ? "s" : ""}`,
    );
  }

  async function saveSeries() {
    if (!seriesName.trim()) {
      toast.error("Enter a series name");
      return;
    }
    if (generator.barcodes.length === 0) {
      toast.error("Generate barcodes first");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: seriesName,
        format: generator.format,
        values: generator.barcodes,
      });
      toast.success(`Saved series "${seriesName}"`);
      setSeriesName("");
    } catch {
      toast.error("Failed to save series");
    }
  }

  function loadSeries(series: { format: string; values: string[] }) {
    setGenerator({
      ...generator,
      format: series.format as BarcodeFormat,
      barcodes: series.values,
    });
    toast.success("Series loaded");
  }

  async function deleteSeries(id: bigint) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Series deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function exportCSV() {
    if (generator.barcodes.length === 0) {
      toast.error("No barcodes to export");
      return;
    }
    const csv = [
      "#,Value",
      ...generator.barcodes.map((v, i) => `${i + 1},${v}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barcodes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Format + Template */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Barcode Format
              </Label>
              <Select
                value={generator.format}
                onValueChange={(v) =>
                  setGenerator({ ...generator, format: v as BarcodeFormat })
                }
              >
                <SelectTrigger
                  data-ocid="generator.select"
                  className="h-8 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Label Template
              </Label>
              <Select
                value={generator.template}
                onValueChange={(v) =>
                  setGenerator({ ...generator, template: v as LabelTemplate })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Label Size
              </Label>
              <Select
                value={generator.labelSizePreset}
                onValueChange={(v) =>
                  setGenerator({
                    ...generator,
                    labelSizePreset: v as LabelSizePreset,
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generator.labelSizePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Width (mm)
                    </Label>
                    <Input
                      type="number"
                      value={generator.customWidth}
                      onChange={(e) =>
                        setGenerator({
                          ...generator,
                          customWidth: Number(e.target.value),
                        })
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Height (mm)
                    </Label>
                    <Input
                      type="number"
                      value={generator.customHeight}
                      onChange={(e) =>
                        setGenerator({
                          ...generator,
                          customHeight: Number(e.target.value),
                        })
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {generator.template === "warehouse" && (
              <div className="space-y-2 p-3 bg-accent/40 rounded-md">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Warehouse Location
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["zone", "aisle", "rack", "bin"] as const).map((field) => (
                    <div key={field}>
                      <Label className="text-xs text-muted-foreground capitalize">
                        {field}
                      </Label>
                      <Input
                        value={warehouseLocation[field]}
                        onChange={(e) =>
                          setWarehouseLocation({
                            ...warehouseLocation,
                            [field]: e.target.value,
                          })
                        }
                        className="h-7 text-xs"
                        placeholder={field.toUpperCase()}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Input Mode */}
            <Tabs value={configTab} onValueChange={setConfigTab}>
              <TabsList className="w-full h-8">
                <TabsTrigger
                  value="sequential"
                  className="flex-1 text-xs"
                  data-ocid="generator.tab"
                >
                  Sequential
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="flex-1 text-xs"
                  data-ocid="generator.tab"
                >
                  Custom
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sequential" className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Prefix
                    </Label>
                    <Input
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="h-7 text-xs"
                      placeholder="ITEM-"
                      data-ocid="generator.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Pad (digits)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={padLength}
                      onChange={(e) => setPadLength(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Start
                    </Label>
                    <Input
                      type="number"
                      value={startNum}
                      onChange={(e) => setStartNum(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input
                      type="number"
                      value={endNum}
                      onChange={(e) => setEndNum(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Step
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={step}
                      onChange={(e) => setStep(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Copies each
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={copiesPerBarcode}
                      onChange={(e) =>
                        setCopiesPerBarcode(Number(e.target.value))
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="custom" className="mt-3">
                <Label className="text-xs text-muted-foreground">
                  Values (one per line)
                </Label>
                <Textarea
                  value={customValues}
                  onChange={(e) => setCustomValues(e.target.value)}
                  className="text-xs font-mono h-28 resize-none"
                  placeholder="ITEM001&#10;ITEM002&#10;ITEM003"
                  data-ocid="generator.textarea"
                />
              </TabsContent>
            </Tabs>

            <Button
              onClick={generate}
              className="w-full"
              data-ocid="generator.primary_button"
            >
              <ScanLine className="w-4 h-4 mr-2" />
              Generate Barcodes
            </Button>

            <Separator />

            {/* Save Series */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Save Series
              </Label>
              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Login to save series to the cloud
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  placeholder="Series name"
                  className="h-8 text-sm flex-1"
                  data-ocid="generator.input"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveSeries}
                  disabled={createMutation.isPending || !isLoggedIn}
                  data-ocid="generator.save_button"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {generator.barcodes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="w-full"
                data-ocid="generator.secondary_button"
              >
                <Download className="w-3 h-3 mr-2" />
                Export CSV ({generator.barcodes.length})
              </Button>
            )}

            {/* Saved Series */}
            {savedSeries && savedSeries.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Saved Series
                </Label>
                <div className="space-y-1">
                  {savedSeries.map((s) => (
                    <div
                      key={String(s.id)}
                      className="flex items-center gap-1 p-2 rounded hover:bg-accent/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.format} · {s.values.length} items
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                        onClick={() => loadSeries(s)}
                        data-ocid="generator.button"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() => deleteSeries(s.id)}
                        data-ocid="generator.delete_button"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Preview */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-sm font-medium">
            Preview
            {generator.barcodes.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {generator.barcodes.length} barcodes
              </Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {labelSize.widthMm}×{labelSize.heightMm}mm
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {generator.barcodes.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-48 text-muted-foreground"
                data-ocid="generator.empty_state"
              >
                <ScanLine className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No barcodes generated yet</p>
                <p className="text-xs mt-1">
                  Configure options and click Generate
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2"
              >
                {generator.barcodes.slice(0, 100).map((v, i) => (
                  <motion.div
                    key={`barcode-${String(i)}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    data-ocid={`generator.item.${i + 1}`}
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
                      fontSize={settings.fontSize}
                      fontFamily={settings.fontFamily}
                      showText={settings.showText}
                      textPosition={settings.textPosition}
                      borderColor={settings.borderColor}
                      borderWidth={settings.borderWidth}
                      borderStyle={settings.borderStyle}
                    />
                  </motion.div>
                ))}
                {generator.barcodes.length > 100 && (
                  <div className="flex items-center justify-center p-3 text-xs text-muted-foreground border border-dashed rounded">
                    +{generator.barcodes.length - 100} more
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Print area (hidden visually, used for printing) */}
        <div id="print-area" style={{ display: "none" }}>
          <div className="print-grid p-4">
            {generator.barcodes.map((v, i) => (
              <LabelCard
                key={`print-${String(i)}`}
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
                fontSize={settings.fontSize}
                fontFamily={settings.fontFamily}
                showText={settings.showText}
                textPosition={settings.textPosition}
                borderColor={settings.borderColor}
                borderWidth={settings.borderWidth}
                borderStyle={settings.borderStyle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
