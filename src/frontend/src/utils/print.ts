/**
 * Opens a new window, injects barcode HTML with necessary styles, and prints.
 * Only the barcode content is printed, not the app UI.
 */
export function printHTML(
  html: string,
  pageWidth: string,
  pageHeight: string,
  margins = "5mm",
) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) {
    alert("Popup blocked. Please allow popups for this site to print.");
    return;
  }

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Print</title>
  <style>
    @page { size: ${pageWidth} ${pageHeight}; margin: ${margins}; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-1 { flex: 1; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-start { justify-content: flex-start; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .overflow-hidden { overflow: hidden; }
    .w-full { width: 100%; }
    .min-h-0 { min-height: 0; }
    .text-center { text-align: center; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: bold; }
    .font-semibold { font-weight: 600; }
    .leading-tight { line-height: 1.25; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .shrink-0 { flex-shrink: 0; }
    .px-1 { padding-left: 4px; padding-right: 4px; }
    .pt-1 { padding-top: 4px; }
    .pb-0\\.5 { padding-bottom: 2px; }
    .bg-white { background: white; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .rounded { border-radius: 4px; }
    .p-2 { padding: 8px; }
    .object-contain { object-fit: contain; }
    .barcode-card-print svg { display: block; width: 100%; height: auto; }
    .label-card svg { display: block; width: 100%; height: auto; }
    .page-break { page-break-after: always; }
    /* Hang tag styles */
    .hangtag-card { display: flex; flex-direction: column; page-break-inside: avoid; break-inside: avoid; }
    .hangtag-brand { font-weight: bold; text-align: center; font-size: 14px; margin-bottom: 4px; }
    .hangtag-product { font-size: 11px; text-align: center; margin-bottom: 2px; }
    .hangtag-price { font-weight: bold; font-size: 18px; text-align: center; margin: 6px 0; }
    .hangtag-sku { font-size: 9px; color: #666; text-align: center; }
    .hangtag-size { font-size: 10px; text-align: center; margin-bottom: 4px; }
    .hangtag-divider { border: none; border-top: 1px solid #ccc; margin: 6px 4px; }
    .hangtag-barcode { width: 100%; }
    .hangtag-barcode svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  ${html}
  <script>
    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); };
  <\/script>
</body>
</html>
  `);
  win.document.close();
}
