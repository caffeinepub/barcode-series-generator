# Barcode Series Generator Pro

## Current State
The app has a sidebar config panel with sequential/custom barcode generation, multiple formats (Code128, Code39, EAN-13, EAN-8, UPC-A, ITF-14), label templates (standard, warehouse, EAN, price), label size presets, copies-per-barcode, labels-per-page, save/load series to backend, and a basic print button using window.print().

No login/logout, no menu navigation, no page setup, no font/color customization, no print preview, no thermal printer presets.

## Requested Changes (Diff)

### Add
- Login / Logout via Internet Identity (authorization component)
- Top navigation menu bar with sections: Generator, Page Setup, Print Settings, Data Manager, About
- Page Setup panel: paper size (A4, Letter, Legal, 4x6", custom), orientation (portrait/landscape), margins
- Font settings: font size (small/medium/large/custom pt), font family (Mono, Sans, Serif)
- Color options: barcode bar color, background color, text color, label border color
- One barcode per page layout option
- TMS 244 Pro / thermal label printer presets (57mm, 62mm, 100mm roll widths)
- Print preview modal showing paginated layout before printing
- Auto/detect printer hints panel with suggested settings per media type
- Data Manager page: view, rename, export (CSV) saved series
- Export barcodes as SVG zip / CSV
- Additional barcode formats: QR placeholder text, DataMatrix note
- "Print with text below" toggle (already partial, make prominent)
- More label templates: shipping, asset tag, product

### Modify
- Header: add user avatar/login button on right
- Print button: opens print preview modal instead of direct print
- Sidebar: organized into collapsible sections
- Footer: keep as-is

### Remove
- Nothing removed

## Implementation Plan
1. Add authorization component for login/logout
2. Regenerate backend to support user-scoped series and app settings storage
3. Build enhanced frontend:
   a. Navigation menu (tabs/sidebar nav) for Generator, Page Setup, Print Settings, Data Manager
   b. Login/logout button in header using useInternetIdentity
   c. Page setup state: paperSize, orientation, margins, labelsPerPage (from page size), one-per-page mode
   d. Typography state: fontSize, fontFamily
   e. Color state: barColor, bgColor, textColor, borderColor
   f. Thermal printer presets panel (TMS 244 Pro, Zebra ZD, Dymo, Generic)
   g. Print preview modal with paginated barcode layout
   h. Data Manager tab: table of saved series, rename, export CSV
   i. Enhanced label card using font/color settings
