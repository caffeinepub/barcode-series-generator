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
  ImagePlus,
  Loader2,
  Printer,
  Save,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
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
  HangTagData,
  LabelSizePreset,
  LabelTemplate,
  WarehouseLocation,
} from "../lib/labelTemplates";
import { LABEL_SIZE_PRESETS } from "../lib/labelTemplates";
import { LabelCard } from "./LabelCard";
import { type PrintItem, PrintPreviewModal } from "./PrintPreviewModal";

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
  { value: "hangtag", label: "Hang Tag" },
];

const SIZE_OPTIONS: { value: LabelSizePreset; label: string }[] = [
  { value: "xs", label: "XS — 25×15mm" },
  { value: "sm", label: "Small — 38×19mm" },
  { value: "md", label: "Medium — 57×32mm" },
  { value: "lg", label: "Large — 102×64mm" },
  { value: "hangtag", label: "Hang Tag — 50×80mm" },
  { value: "custom", label: "Custom" },
];

const TEXT_SIZE_OPTIONS: {
  value: "sm" | "md" | "lg" | "xl";
  label: string;
  pt: number;
}[] = [
  { value: "sm", label: "Small", pt: 7 },
  { value: "md", label: "Medium", pt: 10 },
  { value: "lg", label: "Large", pt: 14 },
  { value: "xl", label: "XL", pt: 18 },
];

interface BarcodeItemMeta {
  description: string;
  photoDataUrl: string | null;
}

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
  const [hangTag, setHangTag] = useState<HangTagData>({
    brandName: "",
    productName: "",
    sku: "",
    size: "",
    price: "",
    currency: "£",
  });
  const [detailTextSize, setDetailTextSize] = useState<
    "sm" | "md" | "lg" | "xl"
  >("md");
  const [largeBarcodeHeight, setLargeBarcodeHeight] = useState(false);
  const [seriesName, setSeriesName] = useState("");
  const [copiesPerBarcode, setCopiesPerBarcode] = useState(1);
  const [itemMeta, setItemMeta] = useState<Record<number, BarcodeItemMeta>>({});
  const [showPrint, setShowPrint] = useState(false);
  const photoRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { data: savedSeries } = useListSeries();
  const createMutation = useCreateSeries();
  const deleteMutation = useDeleteSeries();

  const textSizePt =
    TEXT_SIZE_OPTIONS.find((o) => o.value === detailTextSize)?.pt ?? 10;

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
      if (copiesPerBarcode > 1) {
        const expanded: string[] = [];
        for (const v of vals) {
          for (let c = 0; c < copiesPerBarcode; c++) expanded.push(v);
        }
        vals = expanded;
      }
    } else {
      vals = customValues
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (vals.length === 0) {
      toast.error("No barcodes to generate");
      return;
    }
    if (vals.length > 500) {
      toast.error("Max 500 barcodes at a time");
      return;
    }
    // Auto-set label size for hangtag template
    const newLabelSizePreset =
      generator.template === "hangtag" &&
      generator.labelSizePreset !== "hangtag" &&
      generator.labelSizePreset !== "custom"
        ? "hangtag"
        : generator.labelSizePreset;
    setGenerator({
      ...generator,
      barcodes: vals,
      labelSizePreset: newLabelSizePreset,
      warehouseLocation,
    });
    setItemMeta({});
    toast.success(`Generated ${vals.length} barcodes`);
  }

  function loadSeries(s: { format: string; values: string[] }) {
    setGenerator({
      ...generator,
      format: s.format as BarcodeFormat,
      barcodes: s.values,
    });
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
      toast.success("Series saved");
      setSeriesName("");
    } catch {
      toast.error("Failed to save");
    }
  }

  async function deleteSeries(id: bigint) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function exportCSV() {
    const csv = generator.barcodes.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barcodes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePhotoUpload(index: number, file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setItemMeta((prev) => ({
        ...prev,
        [index]: {
          ...(prev[index] ?? { description: "", photoDataUrl: null }),
          photoDataUrl: e.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }

  function setDescription(index: number, desc: string) {
    setItemMeta((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] ?? { description: "", photoDataUrl: null }),
        description: desc,
      },
    }));
  }

  function openPrintPreview() {
    if (generator.barcodes.length === 0) {
      toast.error("Generate barcodes first");
      return;
    }
    setShowPrint(true);
  }

  const printItems: PrintItem[] = generator.barcodes.map((v, i) => ({
    value: v,
    description: itemMeta[i]?.description || undefined,
    photoDataUrl: itemMeta[i]?.photoDataUrl || undefined,
  }));

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card/90 backdrop-blur-sm flex flex-col overflow-hidden">
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
                onValueChange={(v) => {
                  const tmpl = v as LabelTemplate;
                  // Auto-set size to hangtag when hangtag template selected
                  const newPreset =
                    tmpl === "hangtag"
                      ? "hangtag"
                      : generator.labelSizePreset === "hangtag"
                        ? "md"
                        : generator.labelSizePreset;
                  setGenerator({
                    ...generator,
                    template: tmpl,
                    labelSizePreset: newPreset,
                  });
                }}
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

            {/* Detail Text Size + Large Barcode */}
            <div className="space-y-2 p-3 bg-accent/30 rounded-md border border-border/50">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Barcode Detail Options
              </Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Detail Text Size
                  </Label>
                  <Select
                    value={detailTextSize}
                    onValueChange={(v) =>
                      setDetailTextSize(v as "sm" | "md" | "lg" | "xl")
                    }
                  >
                    <SelectTrigger
                      className="h-7 text-xs mt-1"
                      data-ocid="generator.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEXT_SIZE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label} ({o.pt}pt)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="largeBarcodeHeight"
                    checked={largeBarcodeHeight}
                    onChange={(e) => setLargeBarcodeHeight(e.target.checked)}
                    className="w-3.5 h-3.5"
                    data-ocid="generator.checkbox"
                  />
                  <Label
                    htmlFor="largeBarcodeHeight"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Large Barcode Height
                  </Label>
                </div>
              </div>
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

            {generator.template === "hangtag" && (
              <div className="space-y-2 p-3 bg-accent/40 rounded-md">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hang Tag Details
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      Brand Name
                    </Label>
                    <Input
                      value={hangTag.brandName}
                      onChange={(e) =>
                        setHangTag({ ...hangTag, brandName: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="My Brand"
                      data-ocid="generator.input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      Product Name
                    </Label>
                    <Input
                      value={hangTag.productName}
                      onChange={(e) =>
                        setHangTag({ ...hangTag, productName: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="Classic T-Shirt"
                      data-ocid="generator.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SKU</Label>
                    <Input
                      value={hangTag.sku}
                      onChange={(e) =>
                        setHangTag({ ...hangTag, sku: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="SKU-001"
                      data-ocid="generator.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Size
                    </Label>
                    <Input
                      value={hangTag.size}
                      onChange={(e) =>
                        setHangTag({ ...hangTag, size: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="M / 32 / XL"
                      data-ocid="generator.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Currency
                    </Label>
                    <Select
                      value={hangTag.currency}
                      onValueChange={(v) =>
                        setHangTag({
                          ...hangTag,
                          currency: v as HangTagData["currency"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-7 text-xs"
                        data-ocid="generator.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="£">£ GBP</SelectItem>
                        <SelectItem value="$">$ USD</SelectItem>
                        <SelectItem value="₹">₹ INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Price
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={hangTag.price}
                      onChange={(e) =>
                        setHangTag({ ...hangTag, price: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="9.99"
                      data-ocid="generator.input"
                    />
                  </div>
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
                  placeholder={"ITEM001\nITEM002\nITEM003"}
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

            {generator.barcodes.length > 0 && (
              <Button
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={openPrintPreview}
                data-ocid="generator.print_button"
              >
                <Printer className="w-4 h-4 mr-2" />
                Preview & Print ({generator.barcodes.length})
              </Button>
            )}

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
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/70 backdrop-blur-sm">
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
                className="flex flex-wrap gap-3"
              >
                {generator.barcodes.slice(0, 100).map((v, i) => (
                  <motion.div
                    key={`barcode-${String(i)}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="flex flex-col gap-1"
                    data-ocid={`generator.item.${i + 1}`}
                  >
                    {/* Per-item photo */}
                    {itemMeta[i]?.photoDataUrl && (
                      <div className="relative">
                        <img
                          src={itemMeta[i].photoDataUrl!}
                          alt=""
                          className="rounded object-contain"
                          style={{
                            width: `${labelSize.widthMm}mm`,
                            maxHeight: "30px",
                          }}
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 w-4 h-4 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
                          onClick={() =>
                            setItemMeta((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], photoDataUrl: null },
                            }))
                          }
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
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
                      hangTagData={
                        generator.template === "hangtag" ? hangTag : undefined
                      }
                      barcodeHeightMode={
                        largeBarcodeHeight ? "large" : "normal"
                      }
                      barColor={settings.barColor}
                      bgColor={settings.bgColor}
                      textColor={settings.textColor}
                      fontSize={textSizePt}
                      fontFamily={settings.fontFamily}
                      showText={settings.showText}
                      textPosition={settings.textPosition}
                      borderColor={settings.borderColor}
                      borderWidth={settings.borderWidth}
                      borderStyle={settings.borderStyle}
                    />
                    {/* Per-item description & photo upload */}
                    <div
                      className="flex gap-1 items-center"
                      style={{ width: `${labelSize.widthMm}mm` }}
                    >
                      <input
                        type="text"
                        placeholder="Note..."
                        value={itemMeta[i]?.description || ""}
                        onChange={(e) => setDescription(i, e.target.value)}
                        className="flex-1 text-xs border border-input rounded px-1 py-0.5 bg-background/80 min-w-0"
                      />
                      <button
                        type="button"
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-input bg-background/80 hover:bg-accent"
                        onClick={() => photoRefs.current[i]?.click()}
                        title="Add photo"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => {
                          photoRefs.current[i] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(i, file);
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
                {generator.barcodes.length > 100 && (
                  <div className="text-xs text-muted-foreground p-2 self-end">
                    +{generator.barcodes.length - 100} more
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      <PrintPreviewModal
        open={showPrint}
        onClose={() => setShowPrint(false)}
        items={printItems}
        format={generator.format}
        template={generator.template}
        warehouseLocation={
          generator.template === "warehouse"
            ? generator.warehouseLocation
            : undefined
        }
        hangTagData={generator.template === "hangtag" ? hangTag : undefined}
        barcodeHeightMode={largeBarcodeHeight ? "large" : "normal"}
        widthMm={labelSize.widthMm}
        heightMm={labelSize.heightMm}
        barColor={settings.barColor}
        bgColor={settings.bgColor}
        textColor={settings.textColor}
        fontSize={textSizePt}
        fontFamily={settings.fontFamily}
        showText={settings.showText}
        textPosition={settings.textPosition}
        borderColor={settings.borderColor}
        borderWidth={settings.borderWidth}
        borderStyle={settings.borderStyle}
      />
    </div>
  );
}
