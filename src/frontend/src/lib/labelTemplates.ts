export type LabelTemplate = "standard" | "warehouse" | "ean" | "price";

export type LabelSizePreset = "xs" | "sm" | "md" | "lg" | "custom";

export interface LabelSize {
  widthMm: number;
  heightMm: number;
}

export const LABEL_SIZE_PRESETS: Record<LabelSizePreset, LabelSize | null> = {
  xs: { widthMm: 25, heightMm: 15 },
  sm: { widthMm: 38, heightMm: 19 },
  md: { widthMm: 57, heightMm: 32 },
  lg: { widthMm: 102, heightMm: 64 },
  custom: null,
};

export interface WarehouseLocation {
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
}
