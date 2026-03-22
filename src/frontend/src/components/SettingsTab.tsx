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
import { Loader2, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS, useAppContext } from "../contexts/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveUserSettings } from "../hooks/useQueries";
import { LabelCard } from "./LabelCard";

export function SettingsTab() {
  const { settings, setSettings, generator } = useAppContext();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const saveSettingsMutation = useSaveUserSettings();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (isLoggedIn) {
        await saveSettingsMutation.mutateAsync(JSON.stringify(settings));
      }
      localStorage.setItem("bsg_settings", JSON.stringify(settings));
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    toast.success("Settings reset to defaults");
  }

  const previewValue = generator.barcodes[0] ?? "SAMPLE-001";
  const previewFormat = generator.format;

  return (
    <div className="flex h-full overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-lg space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Typography
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Font Size</Label>
                <Select
                  value={String(settings.fontSize)}
                  onValueChange={(v) =>
                    setSettings({ ...settings, fontSize: Number(v) })
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="settings.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { v: 8, l: "Small (8pt)" },
                      { v: 10, l: "Medium (10pt)" },
                      { v: 12, l: "Large (12pt)" },
                      { v: 14, l: "XL (14pt)" },
                    ].map(({ v, l }) => (
                      <SelectItem key={v} value={String(v)}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Custom Font Size (pt)</Label>
                <Input
                  type="number"
                  min={6}
                  max={24}
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="h-8 text-sm"
                  data-ocid="settings.input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Font Family</Label>
                <ToggleGroup
                  type="single"
                  value={settings.fontFamily}
                  onValueChange={(v) =>
                    v &&
                    setSettings({
                      ...settings,
                      fontFamily: v as typeof settings.fontFamily,
                    })
                  }
                  className="w-full"
                >
                  <ToggleGroupItem
                    value="monospace"
                    className="flex-1 text-xs"
                    data-ocid="settings.toggle"
                  >
                    Monospace
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="sans-serif"
                    className="flex-1 text-xs"
                    data-ocid="settings.toggle"
                  >
                    Sans-serif
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="serif"
                    className="flex-1 text-xs"
                    data-ocid="settings.toggle"
                  >
                    Serif
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Colors
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { key: "barColor", label: "Bar Color" },
                  { key: "bgColor", label: "Background Color" },
                  { key: "textColor", label: "Text Color" },
                  { key: "borderColor", label: "Border Color" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings[key]}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                      data-ocid="settings.input"
                    />
                    <Input
                      value={settings[key]}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                      className="h-8 text-xs font-mono flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Border
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Border Style</Label>
                <Select
                  value={settings.borderStyle}
                  onValueChange={(v) =>
                    setSettings({
                      ...settings,
                      borderStyle: v as typeof settings.borderStyle,
                    })
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="settings.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Border Width (px)</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  value={settings.borderWidth}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      borderWidth: Number(e.target.value),
                    })
                  }
                  className="h-8 text-sm"
                  data-ocid="settings.input"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Text Display
            </h2>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.showText}
                onCheckedChange={(v) =>
                  setSettings({ ...settings, showText: v })
                }
                data-ocid="settings.switch"
              />
              <Label className="text-sm">Show barcode value text</Label>
            </div>
            {settings.showText && (
              <div className="space-y-1.5">
                <Label className="text-xs">Text Position</Label>
                <ToggleGroup
                  type="single"
                  value={settings.textPosition}
                  onValueChange={(v) =>
                    v &&
                    setSettings({
                      ...settings,
                      textPosition: v as "above" | "below",
                    })
                  }
                  className="w-48"
                >
                  <ToggleGroupItem
                    value="below"
                    className="flex-1 text-xs"
                    data-ocid="settings.toggle"
                  >
                    Below
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="above"
                    className="flex-1 text-xs"
                    data-ocid="settings.toggle"
                  >
                    Above
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
              data-ocid="settings.save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={resetSettings}
              data-ocid="settings.button"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Live Preview */}
      <div className="w-64 flex-shrink-0 border-l border-border bg-muted/20 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live Preview
        </p>
        <LabelCard
          value={previewValue}
          format={previewFormat}
          template="standard"
          widthMm={57}
          heightMm={32}
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
        <p className="text-xs text-muted-foreground text-center">
          {previewValue}
        </p>
      </div>
    </div>
  );
}
