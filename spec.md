# Barcode Series Generator — Upgrade

## Current State
App has: sequential/custom barcode generation, 4 formats (Code128, Code39, EAN-13, UPC-A), save/load/delete series from backend, basic print (window.print).

## Requested Changes (Diff)

### Add
- **EAN-8 format** (8-digit EAN, compute check digit): add encoding to barcode.ts
- **ITF-14 format** (Interleaved 2-of-5, 14-digit): add encoding to barcode.ts
- **Label templates**: Standard Barcode, Warehouse Location Sticker, EAN Retail Label, Price Label
- **Warehouse Location Sticker template**: large text fields for Zone, Aisle, Rack, Bin — rendered on the label alongside barcode
- **Label size presets**: XS (25x15mm), Small (38x19mm), Medium (57x32mm), Large (102x64mm), Custom (user inputs width×height in mm)
- **Labels per page selector**: 1, 2, 4, 6, 8, 12, 24, 30 per sheet
- **Copies per barcode**: numeric input (1–99)
- **Print preview area**: shows label layout at chosen size with template
- **Improved print CSS**: honor selected label size via @page and label dimensions in mm; auto-detect printer via browser print dialog

### Modify
- Config sidebar: add Label Template section below Format, add Size and Copies controls
- Barcode grid: render labels using the selected template (warehouse sticker shows zone/aisle/rack/bin fields)
- Print button: open browser print dialog (auto-detects printer)
- Format options list: add EAN-8 and ITF-14

### Remove
- Nothing removed

## Implementation Plan
1. Add `encodeEAN8` and `encodeITF14` functions to `lib/barcode.ts`; export new `BarcodeFormat` union
2. Create `lib/labelTemplates.ts` defining template types and their rendering configs
3. Update `App.tsx`:
   - Add template, size, copies state
   - Add warehouse location fields (zone, aisle, rack, bin) shown when template = "warehouse"
   - Pass new props to label rendering
4. Create `components/LabelCard.tsx` — renders a label card based on selected template and size, used in grid and print
5. Add print CSS in `index.css`: `@media print` rules using CSS variables for label size; hide non-print-area elements
6. Wire together: generate uses copies multiplier, grid uses LabelCard, print button triggers window.print()
