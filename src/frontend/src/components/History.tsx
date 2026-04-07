import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCopy,
  Clock,
  Loader2,
  QrCode,
  ScanLine,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useDeleteSeries, useListSeries } from "../hooks/useQueries";
import {
  type LocalSeries,
  type ScanRecord,
  deleteLocalSeries,
  loadLocalSeries,
  loadScanHistory,
  saveScanHistory,
} from "../utils/storage";

function formatTime(ts: number) {
  return new Date(ts).toLocaleString();
}

function ScanHistoryTab() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    setHistory(loadScanHistory());
  }, []);

  function copyValue(val: string) {
    navigator.clipboard.writeText(val).then(() => toast.success("Copied!"));
  }

  function deleteItem(id: string) {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveScanHistory(updated);
  }

  function clearAll() {
    setHistory([]);
    saveScanHistory([]);
    toast.success("Scan history cleared");
  }

  return (
    <div className="p-4 space-y-3">
      {history.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {history.length} records
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={clearAll}
            data-ocid="history.delete_button"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}
      {history.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="history.empty_state"
        >
          <ScanLine className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm">No scan history yet</p>
          <p className="text-xs mt-1">
            Start scanning barcodes to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-accent/30 transition-colors"
              data-ocid={`history.item.${i + 1}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {item.format === "QR_CODE" ? (
                  <QrCode className="w-4 h-4 text-primary" />
                ) : (
                  <ScanLine className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium truncate">
                  {item.value}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    {item.format}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => copyValue(item.value)}
                data-ocid={`history.button.${i + 1}`}
              >
                <ClipboardCopy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => deleteItem(item.id)}
                data-ocid={`history.delete_button.${i + 1}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LocalSeriesTab() {
  const [series, setSeries] = useState<LocalSeries[]>([]);

  useEffect(() => {
    setSeries(loadLocalSeries());
  }, []);

  function deleteItem(id: string) {
    deleteLocalSeries(id);
    setSeries((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="p-4 space-y-3">
      {series.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="history.empty_state"
        >
          <ScanLine className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm">No locally saved series</p>
          <p className="text-xs mt-1">Generate barcodes and save locally</p>
        </div>
      ) : (
        <div className="space-y-2">
          {series.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
              data-ocid={`history.item.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    {s.format}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {s.values.length} barcodes
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(s.timestamp)}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => deleteItem(s.id)}
                data-ocid={`history.delete_button.${i + 1}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CloudSeriesTab() {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: series, isLoading } = useListSeries();
  const deleteMutation = useDeleteSeries();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ScanLine className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm">Login to see cloud-saved series</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="history.loading_state"
      >
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!series || series.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        data-ocid="history.empty_state"
      >
        <ScanLine className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm">No cloud series saved</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {series.map((s, i) => (
        <div
          key={String(s.id)}
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
          data-ocid={`history.item.${i + 1}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{s.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs h-4 px-1">
                {s.format}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {s.values.length} barcodes
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate(s.id)}
            disabled={deleteMutation.isPending}
            data-ocid={`history.delete_button.${i + 1}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function History() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-semibold">History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Scan history and saved barcode series
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="scanned">
            <div className="px-6 pt-4">
              <TabsList className="w-full">
                <TabsTrigger
                  value="scanned"
                  className="flex-1"
                  data-ocid="history.tab"
                >
                  Scanned Codes
                </TabsTrigger>
                <TabsTrigger
                  value="local"
                  className="flex-1"
                  data-ocid="history.tab"
                >
                  Local Series
                </TabsTrigger>
                <TabsTrigger
                  value="cloud"
                  className="flex-1"
                  data-ocid="history.tab"
                >
                  Cloud Series
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="scanned">
              <ScanHistoryTab />
            </TabsContent>
            <TabsContent value="local">
              <LocalSeriesTab />
            </TabsContent>
            <TabsContent value="cloud">
              <CloudSeriesTab />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
