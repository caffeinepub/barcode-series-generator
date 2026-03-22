import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Download,
  Edit2,
  Loader2,
  LogIn,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { BarcodeSeries } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteSeries,
  useListSeries,
  useRenameSeries,
} from "../hooks/useQueries";

export function DataManagerTab() {
  const { setGenerator, generator } = useAppContext();
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: series, isLoading, refetch } = useListSeries();
  const deleteMutation = useDeleteSeries();
  const renameMutation = useRenameSeries();

  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");

  function startEdit(s: BarcodeSeries) {
    setEditingId(s.id);
    setEditName(s.name);
  }

  async function saveEdit(id: bigint) {
    try {
      await renameMutation.mutateAsync({ id, newName: editName });
      setEditingId(null);
      toast.success("Series renamed");
    } catch {
      toast.error("Failed to rename");
    }
  }

  async function deleteSeries(id: bigint) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Series deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function loadSeries(s: BarcodeSeries) {
    setGenerator({
      ...generator,
      format: s.format as typeof generator.format,
      barcodes: s.values,
    });
    toast.success(`Loaded "${s.name}" — ${s.values.length} barcodes`);
  }

  function exportCSV(s: BarcodeSeries) {
    const csv = ["#,Value", ...s.values.map((v, i) => `${i + 1},${v}`)].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAllCSV() {
    if (!series || series.length === 0) {
      toast.error("No series to export");
      return;
    }
    const rows = ["Series,#,Value"];
    for (const s of series) {
      for (let i = 0; i < s.values.length; i++) {
        rows.push(`${s.name},${i + 1},${s.values[i]}`);
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-series.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(ns: bigint) {
    const ms = Number(ns / 1_000_000n);
    return new Date(ms).toLocaleDateString();
  }

  if (!isLoggedIn) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4"
        data-ocid="data.panel"
      >
        <div className="text-center max-w-xs">
          <LogIn className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h3 className="font-semibold mb-1">Login to Manage Series</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Login to save series to the cloud and access them from any device.
          </p>
          <Button onClick={() => login()} data-ocid="data.primary_button">
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Saved Series</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="h-7 text-xs"
            data-ocid="data.button"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportAllCSV}
            className="h-7 text-xs"
            data-ocid="data.secondary_button"
          >
            <Download className="w-3 h-3 mr-1" />
            Export All CSV
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div
            className="flex items-center justify-center h-32"
            data-ocid="data.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !series || series.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-muted-foreground"
            data-ocid="data.empty_state"
          >
            <p className="text-sm">No saved series yet</p>
            <p className="text-xs mt-1">
              Generate and save barcodes from the Generator tab
            </p>
          </div>
        ) : (
          <Table data-ocid="data.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.map((s, idx) => (
                <TableRow key={String(s.id)} data-ocid={`data.row.${idx + 1}`}>
                  <TableCell>
                    {editingId === s.id ? (
                      <div className="flex gap-1 items-center">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-6 text-xs w-36"
                          data-ocid="data.input"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => saveEdit(s.id)}
                          data-ocid="data.save_button"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setEditingId(null)}
                          data-ocid="data.cancel_button"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium text-sm">{s.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {s.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.values.length}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => loadSeries(s)}
                        data-ocid="data.button"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => startEdit(s)}
                        data-ocid={`data.edit_button.${idx + 1}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => exportCSV(s)}
                        data-ocid={`data.secondary_button.${idx + 1}`}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            data-ocid={`data.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="data.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Series</AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete "{s.name}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="data.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSeries(s.id)}
                              className="bg-destructive hover:bg-destructive/90"
                              data-ocid="data.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
