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
import { ImagePlus, Printer, Save, ScanLine, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../contexts/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { BarcodeFormat } from "../lib/barcode";
import type { LabelTemplate } from "../lib/labelTemplates";
import { checkGuestPrintQuota, markGuestPrintUsed } from "../utils/storage";
import { LabelCard } from "./LabelCard";
import { LoginModal } from "./LoginModal";
import { type PrintItem, PrintPreviewModal } from "./PrintPreviewModal";

const DECORATIVE_ICONS = [
  "📦",
  "🏷️",
  "⚡",
  "🔖",
  "✅",
  "⭐",
  "🎯",
  "🔑",
  "💡",
  "🚀",
  "♻️",
  "📊",
];

const FORMAT_OPTIONS: { value: BarcodeFormat; label: string }[] = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "ITF14", label: "ITF-14" },
  { value: "UPCA", label: "UPC-A" },
];

interface SavedTemplate {
  id: string;
  name: string;
  barcodeValue: string;
  description: string;
  icon: string;
  format: BarcodeFormat;
  template: LabelTemplate;
  borderStyle: "none" | "solid" | "dashed" | "double";
  bgColor: string;
  barColor: string;
  textColor: string;
}

export function LabelDesigner() {
  const { settings } = useAppContext();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const [barcodeValue, setBarcodeValue] = useState("SAMPLE-001");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [barColor, setBarColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#000000");
  const [borderStyle, setBorderStyle] = useState<
    "none" | "solid" | "dashed" | "double"
  >("solid");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [template, setTemplate] = useState<LabelTemplate>("standard");
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bsg_label_templates") || "[]");
    } catch {
      return [];
    }
  });
  const [showPrint, setShowPrint] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setPhotoDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function saveTemplate() {
    if (!templateName.trim()) {
      toast.error("Enter a template name");
      return;
    }
    const t: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName,
      barcodeValue,
      description,
      icon: selectedIcon,
      format,
      template,
      borderStyle,
      bgColor,
      barColor,
      textColor,
    };
    const updated = [t, ...savedTemplates].slice(0, 20);
    setSavedTemplates(updated);
    localStorage.setItem("bsg_label_templates", JSON.stringify(updated));
    toast.success(`Template "${templateName}" saved`);
    setTemplateName("");
  }

  function loadTemplate(t: SavedTemplate) {
    setBarcodeValue(t.barcodeValue);
    setDescription(t.description);
    setSelectedIcon(t.icon);
    setFormat(t.format);
    setTemplate(t.template);
    setBorderStyle(t.borderStyle);
    setBgColor(t.bgColor);
    setBarColor(t.barColor);
    setTextColor(t.textColor);
    toast.success("Template loaded");
  }

  function deleteTemplate(id: string) {
    const updated = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem("bsg_label_templates", JSON.stringify(updated));
  }

  function handlePrint() {
    if (!isLoggedIn && !checkGuestPrintQuota()) {
      setShowLogin(true);
      return;
    }
    setShowPrint(true);
  }

  const printItems: PrintItem[] = [
    {
      value: barcodeValue,
      description: description || undefined,
      photoDataUrl: photoDataUrl || undefined,
    },
  ];

  const borderStyleForLabel = borderStyle === "double" ? "solid" : borderStyle;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Controls Panel */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Barcode Value
              </Label>
              <Input
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                placeholder="Enter barcode value"
                className="h-8 text-sm font-mono"
                data-ocid="designer.input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Format
              </Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as BarcodeFormat)}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="designer.select"
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
                Description Text
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="h-8 text-sm"
                data-ocid="designer.input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photo
              </Label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => photoInputRef.current?.click()}
                  data-ocid="designer.upload_button"
                >
                  <ImagePlus className="w-3 h-3 mr-1.5" />
                  {photoDataUrl ? "Change Photo" : "Add Photo"}
                </Button>
                {photoDataUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setPhotoDataUrl(null)}
                    data-ocid="designer.delete_button"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {photoDataUrl && (
                <img
                  src={photoDataUrl}
                  alt="Label"
                  className="w-full h-16 object-contain rounded border border-border"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Decorative Icon
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {DECORATIVE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() =>
                      setSelectedIcon(selectedIcon === icon ? "" : icon)
                    }
                    className={`w-8 h-8 rounded text-base hover:bg-accent transition-colors ${
                      selectedIcon === icon
                        ? "bg-primary/20 ring-1 ring-primary"
                        : "bg-muted"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Style
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Background
                  </Label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {bgColor}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bars</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="color"
                      value={barColor}
                      onChange={(e) => setBarColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {barColor}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Text</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {textColor}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Border
                  </Label>
                  <Select
                    value={borderStyle}
                    onValueChange={(v) => setBorderStyle(v as any)}
                  >
                    <SelectTrigger className="h-7 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Save Template
              </Label>
              <div className="flex gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="h-8 text-xs flex-1"
                  data-ocid="designer.input"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveTemplate}
                  className="h-8 px-2"
                  data-ocid="designer.save_button"
                >
                  <Save className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {savedTemplates.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Saved Templates
                </Label>
                {savedTemplates.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1.5 p-1.5 rounded hover:bg-accent/50 group"
                    data-ocid={`designer.item.${i + 1}`}
                  >
                    <span className="text-base">{t.icon || "🏷️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {t.barcodeValue}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 opacity-0 group-hover:opacity-100"
                      onClick={() => loadTemplate(t)}
                    >
                      <ScanLine className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => deleteTemplate(t.id)}
                      data-ocid={`designer.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-sm font-medium">Label Preview</span>
          <Button
            onClick={handlePrint}
            size="sm"
            data-ocid="designer.primary_button"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Label
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-100 overflow-auto p-8">
          <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col gap-2 items-center">
            {selectedIcon && (
              <span className="text-3xl mb-1">{selectedIcon}</span>
            )}
            {photoDataUrl && (
              <img
                src={photoDataUrl}
                alt="Label"
                className="max-w-full object-contain rounded"
                style={{ maxHeight: "80px", maxWidth: "200px" }}
              />
            )}
            <LabelCard
              value={barcodeValue || "SAMPLE"}
              format={format}
              template={template}
              widthMm={57}
              heightMm={32}
              barColor={barColor}
              bgColor={bgColor}
              textColor={textColor}
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              showText={true}
              textPosition="below"
              borderColor="#cccccc"
              borderWidth={1}
              borderStyle={borderStyleForLabel as any}
            />
            {description && (
              <p className="text-xs text-gray-600 text-center max-w-xs">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <PrintPreviewModal
        open={showPrint}
        onClose={() => setShowPrint(false)}
        items={printItems}
        format={format}
        template={template}
        widthMm={57}
        heightMm={32}
        barColor={barColor}
        bgColor={bgColor}
        textColor={textColor}
        borderStyle={borderStyleForLabel as any}
      />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
