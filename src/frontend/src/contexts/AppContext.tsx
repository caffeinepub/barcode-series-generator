import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { BarcodeFormat } from "../lib/barcode";
import type {
  LabelSizePreset,
  LabelTemplate,
  WarehouseLocation,
} from "../lib/labelTemplates";

export interface AppSettings {
  fontSize: number;
  fontFamily: "monospace" | "sans-serif" | "serif";
  barColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: "none" | "solid" | "dashed" | "dotted";
  showText: boolean;
  textPosition: "above" | "below";
}

export interface PageSetup {
  paperSize: string;
  paperWidth: number;
  paperHeight: number;
  orientation: "portrait" | "landscape";
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelsPerPage: number;
  onePerPage: boolean;
  labelSizePreset: string;
  labelWidth: number;
  labelHeight: number;
}

export interface PrintConfig {
  printerPreset: string;
  printMode: "normal" | "onePerPage" | "sheet";
  copies: number;
  dpi: number;
}

export interface GeneratorState {
  barcodes: string[];
  format: BarcodeFormat;
  template: LabelTemplate;
  warehouseLocation: WarehouseLocation;
  labelSizePreset: LabelSizePreset;
  customWidth: number;
  customHeight: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 10,
  fontFamily: "monospace",
  barColor: "#000000",
  bgColor: "#ffffff",
  textColor: "#000000",
  borderColor: "#cccccc",
  borderWidth: 1,
  borderStyle: "solid",
  showText: true,
  textPosition: "below",
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  paperSize: "A4",
  paperWidth: 210,
  paperHeight: 297,
  orientation: "portrait",
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  labelsPerPage: 12,
  onePerPage: false,
  labelSizePreset: "md",
  labelWidth: 57,
  labelHeight: 32,
};

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  printerPreset: "generic",
  printMode: "sheet",
  copies: 1,
  dpi: 203,
};

export const DEFAULT_GENERATOR: GeneratorState = {
  barcodes: [],
  format: "CODE128",
  template: "standard",
  warehouseLocation: { zone: "", aisle: "", rack: "", bin: "" },
  labelSizePreset: "md",
  customWidth: 57,
  customHeight: 32,
};

interface AppContextType {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  pageSetup: PageSetup;
  setPageSetup: (p: PageSetup) => void;
  printConfig: PrintConfig;
  setPrintConfig: (p: PrintConfig) => void;
  generator: GeneratorState;
  setGenerator: (g: GeneratorState) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pageSetup, setPageSetup] = useState<PageSetup>(DEFAULT_PAGE_SETUP);
  const [printConfig, setPrintConfig] =
    useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [generator, setGenerator] = useState<GeneratorState>(DEFAULT_GENERATOR);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const s = localStorage.getItem("bsg_settings");
      if (s) setSettings(JSON.parse(s));
      const p = localStorage.getItem("bsg_page_setup");
      if (p) setPageSetup(JSON.parse(p));
      const pc = localStorage.getItem("bsg_print_config");
      if (pc) setPrintConfig(JSON.parse(pc));
    } catch {}
  }, []);

  const handleSetSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    try {
      localStorage.setItem("bsg_settings", JSON.stringify(s));
    } catch {}
  }, []);

  const handleSetPageSetup = useCallback((p: PageSetup) => {
    setPageSetup(p);
    try {
      localStorage.setItem("bsg_page_setup", JSON.stringify(p));
    } catch {}
  }, []);

  const handleSetPrintConfig = useCallback((p: PrintConfig) => {
    setPrintConfig(p);
    try {
      localStorage.setItem("bsg_print_config", JSON.stringify(p));
    } catch {}
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        setSettings: handleSetSettings,
        pageSetup,
        setPageSetup: handleSetPageSetup,
        printConfig,
        setPrintConfig: handleSetPrintConfig,
        generator,
        setGenerator,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be inside AppProvider");
  return ctx;
}
