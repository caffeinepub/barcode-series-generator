export interface ScanRecord {
  id: string;
  value: string;
  format: string;
  timestamp: number;
  source: "live" | "photo";
}

export interface LocalSeries {
  id: string;
  name: string;
  format: string;
  values: string[];
  timestamp: number;
}

export function saveScanHistory(items: ScanRecord[]) {
  try {
    localStorage.setItem("bsg_scan_history", JSON.stringify(items));
  } catch {}
}

export function loadScanHistory(): ScanRecord[] {
  try {
    return JSON.parse(localStorage.getItem("bsg_scan_history") || "[]");
  } catch {
    return [];
  }
}

export function addScanRecord(record: ScanRecord) {
  const history = loadScanHistory();
  const updated = [
    record,
    ...history.filter((h) => h.value !== record.value),
  ].slice(0, 100);
  saveScanHistory(updated);
}

export function saveLocalSeries(series: LocalSeries[]) {
  try {
    localStorage.setItem("bsg_local_series", JSON.stringify(series));
  } catch {}
}

export function loadLocalSeries(): LocalSeries[] {
  try {
    return JSON.parse(localStorage.getItem("bsg_local_series") || "[]");
  } catch {
    return [];
  }
}

export function addLocalSeries(series: LocalSeries) {
  const existing = loadLocalSeries();
  const updated = [series, ...existing].slice(0, 50);
  saveLocalSeries(updated);
}

export function deleteLocalSeries(id: string) {
  const existing = loadLocalSeries();
  saveLocalSeries(existing.filter((s) => s.id !== id));
}

export function checkGuestPrintQuota(): boolean {
  return sessionStorage.getItem("bsg_guest_print_used") !== "true";
}

export function markGuestPrintUsed() {
  sessionStorage.setItem("bsg_guest_print_used", "true");
}
