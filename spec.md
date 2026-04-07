# Barcode Series Generator (BSG Pro) - Version 6

## Current State
- Full-featured barcode generator with tabs: Generator, Page Setup, Print Settings, Data Manager, Settings, Scanner
- LabelCard component renders standard, warehouse, EAN, and price label templates
- PrintPreviewModal with printer presets (A4, Letter, TSC, TMS, Zebra, Dymo)
- Sky-blue/light-green gradient background already referenced in conversation but NOT yet applied
- Per-label photos and descriptions supported
- Internet Identity login for cloud storage
- No hang tag template exists
- No large/customizable barcode detail text size option
- Print process uses printHTML utility

## Requested Changes (Diff)

### Add
- **Sky blue + light green gradient background** applied to entire app shell
- **Hang Tag template** ("hangtag") in LabelTemplates:
  - Portrait card shape (e.g. 50mm × 80mm default)
  - Fields: Brand Name, Product Name, SKU, Size, Price with currency selector (£ / $ / ₹)
  - Barcode printed at bottom of hang tag
  - Correct print layout: one hang tag per logical unit, correct mm sizing
- **Barcode detail text customisation**:
  - Text size dropdown: Small (7pt), Medium (10pt), Large (14pt), XL (18pt)
  - Per-label detail fields shown alongside barcode: product name, price, SKU, custom text
  - Large barcode height option (toggle: Normal / Large)
- **Hang Tag input fields** in GeneratorTab when hangtag template is selected:
  - Brand, Product Name, SKU, Size, Price, Currency
- **Correct print format** for all templates including hangtag

### Modify
- `src/frontend/src/index.css` -- add sky blue + light green gradient to app background
- `src/frontend/src/lib/labelTemplates.ts` -- add `"hangtag"` to LabelTemplate type; add LABEL_SIZE_PRESETS entry for hang tag
- `src/frontend/src/components/LabelCard.tsx` -- add hangtag rendering branch; support large barcode height; support text size enum
- `src/frontend/src/components/GeneratorTab.tsx` -- add hang tag fields form section; add text size dropdown; add large barcode toggle
- `src/frontend/src/components/PrintPreviewModal.tsx` -- pass hangtag fields through to LabelCard; ensure hangtag prints correctly
- `src/frontend/src/utils/print.ts` -- ensure correct page-break and sizing for hangtag print output
- `src/frontend/src/App.tsx` -- pass new props through to child components

### Remove
- Nothing removed; all existing features preserved

## Implementation Plan
1. Update `index.css` with sky blue + light green gradient background
2. Update `labelTemplates.ts` to add hangtag type and size preset
3. Update `LabelCard.tsx` to add hangtag branch and text size / large barcode props
4. Update `GeneratorTab.tsx` to add hang tag fields, text size dropdown, large barcode toggle
5. Update `PrintPreviewModal.tsx` and `print.ts` to handle hangtag correctly
6. Update `App.tsx` to wire new props through the component tree
