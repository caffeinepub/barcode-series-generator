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
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Barcode,
  ChevronRight,
  Printer,
  Save,
  ScanLine,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { LabelCard } from "./components/LabelCard";
import {
  useCreateSeries,
  useDeleteSeries,
  useListSeries,
} from "./hooks/useQueries";
import type { BarcodeFormat } from "./lib/barcode";
import {
  LABEL_SIZE_PRESETS,
  type LabelSizePreset,
  type LabelTemplate,
  type WarehouseLocation,
} from "./lib/labelTemplates";

type FormatOption = { value: BarcodeFormat; label: string };
const FORMAT_OPTIONS: FormatOption[] = [
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

const LABELS_PER_PAGE_OPTIONS = [1, 2, 4, 6, 8, 12, 24, 30];

export default function App() {
  // Series config state
  const [configTab, setConfigTab] = useState("sequential");
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(20);
  const [step, setStep] = useState(1);
  const [padLength, setPadLength] = useState(0);
  const [customValues, setCustomValues] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [seriesName, setSeriesName] = useState("");
  const [loadedSeriesId, setLoadedSeriesId] = useState<bigint | null>(null);

  // Label config state
  const [template, setTemplate] = useState<LabelTemplate>("standard");
  const [labelSizePreset, setLabelSizePreset] = useState<LabelSizePreset>("md");
  const [customWidth, setCustomWidth] = useState(57);
  const [customHeight, setCustomHeight] = useState(32);
  const [copiesPerBarcode, setCopiesPerBarcode] = useState(1);
  const [labelsPerPage, setLabelsPerPage] = useState(12);
  const [warehouseLocation, setWarehouseLocation] = useState<WarehouseLocation>(
    {
      zone: "",
      aisle: "",
      rack: "",
      bin: "",
    },
  );

  const labelSize = useMemo(() => {
    if (labelSizePreset === "custom") {
      return { widthMm: customWidth, heightMm: customHeight };
    }
    return LABEL_SIZE_PRESETS[labelSizePreset] ?? { widthMm: 57, heightMm: 32 };
  }, [labelSizePreset, customWidth, customHeight]);

  const displayBarcodes = useMemo(
    () =>
      barcodes.flatMap(
        (v) => Array(Math.max(1, copiesPerBarcode)).fill(v) as string[],
      ),
    [barcodes, copiesPerBarcode],
  );

  const { data: savedSeries = [], isLoading: seriesLoading } = useListSeries();
  const createSeries = useCreateSeries();
  const deleteSeries = useDeleteSeries();

  const handleGenerate = useCallback(() => {
    let values: string[] = [];
    if (configTab === "sequential") {
      if (startNum > endNum) {
        toast.error("Start must be ≤ End");
        return;
      }
      if (endNum - startNum > 9999) {
        toast.error("Maximum 10,000 barcodes at a time");
        return;
      }
      for (let i = startNum; i <= endNum; i += step) {
        const num =
          padLength > 0 ? String(i).padStart(padLength, "0") : String(i);
        values.push(prefix + num);
      }
    } else {
      values = customValues
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length === 0) {
        toast.error("No values entered");
        return;
      }
    }
    setBarcodes(values);
    setLoadedSeriesId(null);
    toast.success(
      `Generated ${values.length} barcode${values.length !== 1 ? "s" : ""}`,
    );
  }, [configTab, prefix, startNum, endNum, step, padLength, customValues]);

  const handleSaveSeries = useCallback(async () => {
    if (!seriesName.trim()) {
      toast.error("Enter a series name");
      return;
    }
    if (barcodes.length === 0) {
      toast.error("Generate barcodes first");
      return;
    }
    try {
      await createSeries.mutateAsync({
        name: seriesName.trim(),
        format,
        values: barcodes,
      });
      toast.success(`Saved series "${seriesName.trim()}"`);
      setSeriesName("");
    } catch {
      toast.error("Failed to save series");
    }
  }, [seriesName, barcodes, format, createSeries]);

  const handleLoadSeries = useCallback(
    (series: {
      id: bigint;
      name: string;
      format: string;
      values: string[];
    }) => {
      setBarcodes(series.values);
      setFormat(series.format as BarcodeFormat);
      setLoadedSeriesId(series.id);
      toast.success(`Loaded "${series.name}"`);
    },
    [],
  );

  const handleDeleteSeries = useCallback(
    async (id: bigint, name: string) => {
      try {
        await deleteSeries.mutateAsync(id);
        if (loadedSeriesId === id) {
          setBarcodes([]);
          setLoadedSeriesId(null);
        }
        toast.success(`Deleted "${name}"`);
      } catch {
        toast.error("Failed to delete series");
      }
    },
    [deleteSeries, loadedSeriesId],
  );

  const handlePrint = () => window.print();

  const updateWarehouseLocation = useCallback(
    (field: keyof WarehouseLocation, val: string) => {
      setWarehouseLocation((prev) => ({ ...prev, [field]: val }));
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* Header */}
      <header className="border-b border-border bg-sidebar px-6 py-3 flex items-center gap-3">
        <ScanLine className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-semibold tracking-widest text-foreground uppercase">
          Barcode Series Generator
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {barcodes.length > 0
              ? `${barcodes.length} barcodes`
              : "No series loaded"}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Config Panel */}
        <aside className="w-80 border-r border-border bg-sidebar flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 border-b border-border">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Series Config
              </h2>

              <Tabs value={configTab} onValueChange={setConfigTab}>
                <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-none h-8">
                  <TabsTrigger
                    data-ocid="config.tab"
                    value="sequential"
                    className="text-xs font-mono rounded-none"
                  >
                    Sequential
                  </TabsTrigger>
                  <TabsTrigger
                    data-ocid="config.tab"
                    value="custom"
                    className="text-xs font-mono rounded-none"
                  >
                    Custom
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sequential" className="mt-3 space-y-3">
                  <div>
                    <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Prefix
                    </Label>
                    <Input
                      data-ocid="config.input"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="e.g. ITEM-"
                      className="mt-1 h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Start
                      </Label>
                      <Input
                        data-ocid="config.input"
                        type="number"
                        value={startNum}
                        onChange={(e) => setStartNum(Number(e.target.value))}
                        className="mt-1 h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        End
                      </Label>
                      <Input
                        data-ocid="config.input"
                        type="number"
                        value={endNum}
                        onChange={(e) => setEndNum(Number(e.target.value))}
                        className="mt-1 h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Step
                      </Label>
                      <Input
                        data-ocid="config.input"
                        type="number"
                        min={1}
                        value={step}
                        onChange={(e) =>
                          setStep(Math.max(1, Number(e.target.value)))
                        }
                        className="mt-1 h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Pad
                      </Label>
                      <Input
                        data-ocid="config.input"
                        type="number"
                        min={0}
                        value={padLength}
                        onChange={(e) =>
                          setPadLength(Math.max(0, Number(e.target.value)))
                        }
                        className="mt-1 h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="mt-3">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Values (one per line)
                  </Label>
                  <Textarea
                    data-ocid="config.textarea"
                    value={customValues}
                    onChange={(e) => setCustomValues(e.target.value)}
                    placeholder={"PROD-001\nPROD-002\nPROD-003"}
                    className="mt-1 font-mono text-xs bg-muted/30 border-border rounded-none resize-none h-36"
                  />
                </TabsContent>
              </Tabs>

              <div className="mt-3">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Format
                </Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as BarcodeFormat)}
                >
                  <SelectTrigger
                    data-ocid="config.select"
                    className="mt-1 h-8 font-mono text-xs bg-muted/30 border-border rounded-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border bg-popover font-mono text-xs">
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                data-ocid="config.primary_button"
                onClick={handleGenerate}
                className="mt-4 w-full h-9 font-mono text-sm font-semibold tracking-wider uppercase rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Barcode className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>

            {/* Label Template */}
            <div className="p-4 border-b border-border">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Label Template
              </h2>
              <Select
                value={template}
                onValueChange={(v) => setTemplate(v as LabelTemplate)}
              >
                <SelectTrigger
                  data-ocid="template.select"
                  className="h-8 font-mono text-xs bg-muted/30 border-border rounded-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border bg-popover font-mono text-xs">
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {template === "warehouse" && (
                <div className="mt-3">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Warehouse Location
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {[
                      { field: "zone" as const, placeholder: "Zone" },
                      { field: "aisle" as const, placeholder: "Aisle" },
                      { field: "rack" as const, placeholder: "Rack" },
                      { field: "bin" as const, placeholder: "Bin" },
                    ].map(({ field, placeholder }) => (
                      <div key={field}>
                        <Label
                          className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider"
                          style={{ fontSize: "9px" }}
                        >
                          {placeholder}
                        </Label>
                        <Input
                          data-ocid={`warehouse.${field}.input`}
                          value={warehouseLocation[field]}
                          onChange={(e) =>
                            updateWarehouseLocation(field, e.target.value)
                          }
                          placeholder={placeholder}
                          className="h-7 font-mono text-xs bg-muted/30 border-border rounded-none mt-0.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Label Size */}
            <div className="p-4 border-b border-border">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Label Size
              </h2>
              <Select
                value={labelSizePreset}
                onValueChange={(v) => setLabelSizePreset(v as LabelSizePreset)}
              >
                <SelectTrigger
                  data-ocid="size.select"
                  className="h-8 font-mono text-xs bg-muted/30 border-border rounded-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border bg-popover font-mono text-xs">
                  {SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {labelSizePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Width (mm)
                    </Label>
                    <Input
                      data-ocid="size.width.input"
                      type="number"
                      min={10}
                      max={300}
                      value={customWidth}
                      onChange={(e) =>
                        setCustomWidth(Math.max(10, Number(e.target.value)))
                      }
                      className="mt-1 h-7 font-mono text-xs bg-muted/30 border-border rounded-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Height (mm)
                    </Label>
                    <Input
                      data-ocid="size.height.input"
                      type="number"
                      min={10}
                      max={300}
                      value={customHeight}
                      onChange={(e) =>
                        setCustomHeight(Math.max(10, Number(e.target.value)))
                      }
                      className="mt-1 h-7 font-mono text-xs bg-muted/30 border-border rounded-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Print Settings */}
            <div className="p-4 border-b border-border">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Print Settings
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Labels per Page
                  </Label>
                  <Select
                    value={String(labelsPerPage)}
                    onValueChange={(v) => setLabelsPerPage(Number(v))}
                  >
                    <SelectTrigger
                      data-ocid="print.labels_per_page.select"
                      className="mt-1 h-8 font-mono text-xs bg-muted/30 border-border rounded-none"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-border bg-popover font-mono text-xs">
                      {LABELS_PER_PAGE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} labels
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Copies per Barcode
                  </Label>
                  <Input
                    data-ocid="print.copies.input"
                    type="number"
                    min={1}
                    max={99}
                    value={copiesPerBarcode}
                    onChange={(e) =>
                      setCopiesPerBarcode(
                        Math.min(99, Math.max(1, Number(e.target.value))),
                      )
                    }
                    className="mt-1 h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Save panel */}
            <div className="p-4 border-b border-border">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Save Series
              </h2>
              <Input
                data-ocid="series.input"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="Series name..."
                className="h-8 font-mono text-sm bg-muted/30 border-border rounded-none"
              />
              <Button
                data-ocid="series.save_button"
                onClick={handleSaveSeries}
                disabled={createSeries.isPending}
                variant="secondary"
                className="mt-2 w-full h-8 font-mono text-xs font-semibold tracking-wider uppercase rounded-none"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                {createSeries.isPending ? "Saving..." : "Save Series"}
              </Button>
            </div>

            {/* Saved series list */}
            <div className="p-4">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                Saved Series
              </h2>
              {seriesLoading ? (
                <div
                  data-ocid="series.loading_state"
                  className="text-xs font-mono text-muted-foreground py-2"
                >
                  Loading...
                </div>
              ) : savedSeries.length === 0 ? (
                <div
                  data-ocid="series.empty_state"
                  className="text-xs font-mono text-muted-foreground py-4 text-center border border-dashed border-border"
                >
                  No saved series
                </div>
              ) : (
                <div className="space-y-1">
                  {savedSeries.map((s, idx) => (
                    <motion.div
                      key={s.id.toString()}
                      data-ocid={`series.item.${idx + 1}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-1 p-2 border cursor-pointer transition-colors ${
                        loadedSeriesId === s.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                      onClick={() => handleLoadSeries(s)}
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-medium text-foreground truncate">
                          {s.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {s.values.length} items · {s.format}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-ocid={`series.delete_button.${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSeries(s.id, s.name);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Actions bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-sidebar/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Output
              </span>
              {displayBarcodes.length > 0 && (
                <Badge className="font-mono text-xs rounded-none bg-primary/20 text-primary border border-primary/30 px-2">
                  {displayBarcodes.length}
                </Badge>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {labelSize.widthMm}×{labelSize.heightMm}mm
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                data-ocid="actions.primary_button"
                onClick={handlePrint}
                disabled={barcodes.length === 0}
                variant="outline"
                size="sm"
                className="h-7 font-mono text-xs uppercase tracking-wider rounded-none border-border hover:bg-primary/10 hover:border-primary/50"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
            </div>
          </div>

          {/* Barcode Grid */}
          <div
            id="print-area"
            className="flex-1 overflow-y-auto p-6 bg-gray-100"
          >
            <AnimatePresence mode="wait">
              {displayBarcodes.length === 0 ? (
                <motion.div
                  key="empty"
                  data-ocid="grid.empty_state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-64 border border-dashed border-gray-300 text-center gap-3 bg-white"
                >
                  <ScanLine className="w-10 h-10 text-gray-300" />
                  <div>
                    <p className="font-mono text-sm text-gray-400">
                      No barcodes generated
                    </p>
                    <p className="font-mono text-xs text-gray-300 mt-1">
                      Configure a series and click Generate
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap gap-3"
                >
                  {displayBarcodes.map((value, idx) => (
                    <motion.div
                      // biome-ignore lint/suspicious/noArrayIndexKey: barcodes may have duplicate values
                      key={`${value}-${idx}`}
                      data-ocid={`grid.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    >
                      <LabelCard
                        value={value}
                        format={format}
                        template={template}
                        widthMm={labelSize.widthMm}
                        heightMm={labelSize.heightMm}
                        warehouseLocation={
                          template === "warehouse"
                            ? warehouseLocation
                            : undefined
                        }
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-2 bg-sidebar flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground/50">
          Barcode Series Generator
        </span>
        <span className="text-xs font-mono text-muted-foreground/50">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
