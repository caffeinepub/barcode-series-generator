import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CameraOff,
  CheckCircle,
  ClipboardCopy,
  FlipHorizontal,
  Image as ImageIcon,
  ScanLine,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "../qr-code/useQRScanner";
import { addScanRecord } from "../utils/storage";

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

interface DetectedCode {
  value: string;
  format: string;
  timestamp: number;
  source: "live" | "photo";
}

function ScanOverlay({ scanning }: { scanning: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className={`relative w-52 h-36 transition-all duration-300 ${scanning ? "opacity-100" : "opacity-40"}`}
      >
        {/* Corners */}
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
          <div
            key={pos}
            className={`absolute w-6 h-6 border-primary ${
              pos === "top-left"
                ? "top-0 left-0 border-t-2 border-l-2"
                : pos === "top-right"
                  ? "top-0 right-0 border-t-2 border-r-2"
                  : pos === "bottom-left"
                    ? "bottom-0 left-0 border-b-2 border-l-2"
                    : "bottom-0 right-0 border-b-2 border-r-2"
            }`}
          />
        ))}
        {/* Scan line */}
        {scanning && (
          <div
            className="absolute left-2 right-2 h-0.5 bg-primary/80"
            style={{
              animation: "scanLine 2s linear infinite",
              top: "50%",
            }}
          />
        )}
      </div>
    </div>
  );
}

function LiveScanTab() {
  const [results, setResults] = useState<DetectedCode[]>([]);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState<
    boolean | null
  >(null);
  const animFrameRef = useRef<number | null>(null);

  const scanner = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
  });

  useEffect(() => {
    setBarcodeDetectorSupported("BarcodeDetector" in window);
  }, []);

  // When QR scanner finds result, save it
  useEffect(() => {
    if (scanner.qrResults.length > 0) {
      const latest = scanner.qrResults[0];
      const rec: DetectedCode = {
        value: latest.data,
        format: "QR_CODE",
        timestamp: latest.timestamp,
        source: "live",
      };
      setResults((prev) => {
        if (prev.length > 0 && prev[0].value === rec.value) return prev;
        addScanRecord({ id: String(rec.timestamp), ...rec });
        return [rec, ...prev.slice(0, 19)];
      });
    }
  }, [scanner.qrResults]);

  // BarcodeDetector scanning loop
  useEffect(() => {
    if (
      !barcodeDetectorSupported ||
      !scanner.isActive ||
      !scanner.videoRef.current
    )
      return;

    const detector = new window.BarcodeDetector();
    let running = true;

    async function detectFrame() {
      if (!running || !scanner.videoRef.current) return;
      const video = scanner.videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const codes: any[] = await detector.detect(video);
          for (const code of codes) {
            const rec: DetectedCode = {
              value: code.rawValue,
              format: code.format,
              timestamp: Date.now(),
              source: "live",
            };
            setResults((prev) => {
              if (prev.length > 0 && prev[0].value === rec.value) return prev;
              addScanRecord({ id: String(rec.timestamp), ...rec });
              return [rec, ...prev.slice(0, 19)];
            });
          }
        } catch {}
      }
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }

    animFrameRef.current = requestAnimationFrame(detectFrame);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [barcodeDetectorSupported, scanner.isActive, scanner.videoRef]);

  function handleStartScan() {
    scanner.startScanning();
  }

  function handleStopScan() {
    scanner.stopScanning();
  }

  function copyValue(val: string) {
    navigator.clipboard.writeText(val).then(() => toast.success("Copied!"));
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Camera Feed */}
      <div
        className="relative bg-black rounded-xl overflow-hidden"
        style={{ aspectRatio: "16/9", maxHeight: "340px" }}
      >
        <video
          ref={scanner.videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={scanner.canvasRef} className="hidden" />
        <ScanOverlay scanning={scanner.isScanning} />

        {!scanner.isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3">
            <Camera className="w-10 h-10 opacity-60" />
            <p className="text-sm opacity-70">Camera inactive</p>
          </div>
        )}

        {scanner.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!scanner.isScanning ? (
          <Button
            onClick={handleStartScan}
            disabled={scanner.isLoading}
            className="flex-1"
            data-ocid="scanner.primary_button"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Scanning
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleStopScan}
            className="flex-1"
            data-ocid="scanner.secondary_button"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scanner.switchCamera()}
          disabled={!scanner.isActive}
          data-ocid="scanner.toggle"
        >
          <FlipHorizontal className="w-4 h-4" />
        </Button>
        {results.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setResults([])}
            data-ocid="scanner.delete_button"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Browser support notice */}
      {barcodeDetectorSupported === false && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Native BarcodeDetector not supported. QR code scanning is available
            via jsQR. For full barcode support, use Chrome on Android or
            desktop.
          </span>
        </div>
      )}
      {barcodeDetectorSupported === true && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>
            Full barcode detection available (QR, EAN, Code128, and more)
          </span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scanned Codes ({results.length})
          </p>
          <ScrollArea className="h-40">
            <div className="space-y-1.5 pr-2">
              {results.map((r, i) => (
                <div
                  key={`scan-${String(i)}`}
                  className="flex items-center gap-2 p-2.5 bg-card border border-border rounded-lg"
                  data-ocid={`scanner.item.${i + 1}`}
                >
                  <ScanLine className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium truncate">
                      {r.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.format}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => copyValue(r.value)}
                    data-ocid={`scanner.button.${i + 1}`}
                  >
                    <ClipboardCopy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {results.length === 0 && !scanner.isScanning && (
        <div
          className="flex flex-col items-center justify-center py-8 text-muted-foreground"
          data-ocid="scanner.empty_state"
        >
          <ScanLine className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">No codes scanned yet</p>
        </div>
      )}
    </div>
  );
}

function PhotoScanTab() {
  const [result, setResult] = useState<DetectedCode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function handleFile(file: File) {
    setIsProcessing(true);
    setResult(null);

    const url = URL.createObjectURL(file);
    setImagePreview(url);

    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsProcessing(false);
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Try BarcodeDetector first
      if ("BarcodeDetector" in window) {
        try {
          const detector = new window.BarcodeDetector();
          const codes: any[] = await detector.detect(canvas);
          if (codes.length > 0) {
            const rec: DetectedCode = {
              value: codes[0].rawValue,
              format: codes[0].format,
              timestamp: Date.now(),
              source: "photo",
            };
            setResult(rec);
            addScanRecord({ id: String(rec.timestamp), ...rec });
            setIsProcessing(false);
            return;
          }
        } catch {}
      }

      // Fallback: jsQR for QR codes
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Dynamically use jsQR if available via window
        if (typeof window !== "undefined" && (window as any).jsQR) {
          const code = (window as any).jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
          );
          if (code?.data) {
            const rec: DetectedCode = {
              value: code.data,
              format: "QR_CODE",
              timestamp: Date.now(),
              source: "photo",
            };
            setResult(rec);
            addScanRecord({ id: String(rec.timestamp), ...rec });
            setIsProcessing(false);
            return;
          }
        }
      } catch {}

      toast.error("No barcode or QR code detected in this image");
      setIsProcessing(false);
    };
    img.src = url;
  }

  function copyValue(val: string) {
    navigator.clipboard.writeText(val).then(() => toast.success("Copied!"));
  }

  return (
    <div className="flex flex-col gap-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload area */}
      <label
        htmlFor="photo-scan-input"
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors block"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        data-ocid="scanner.dropzone"
      >
        <input
          ref={fileInputRef}
          id="photo-scan-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {imagePreview ? (
          <div className="space-y-3">
            <img
              src={imagePreview}
              alt="Scanned"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            <p className="text-xs text-muted-foreground">
              Click to scan different image
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">Drop image or click to upload</p>
            <p className="text-xs text-muted-foreground">
              Supports QR codes, barcodes (EAN, Code128, etc.)
            </p>
          </div>
        )}
      </label>

      {isProcessing && (
        <div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          data-ocid="scanner.loading_state"
        >
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Detecting barcode...
        </div>
      )}

      {result && (
        <div
          className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3"
          data-ocid="scanner.success_state"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-medium text-green-800">Detected!</p>
            <Badge variant="secondary" className="ml-auto text-xs">
              {result.format}
            </Badge>
          </div>
          <div className="font-mono text-lg font-bold text-green-900 break-all">
            {result.value}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => copyValue(result.value)}
            data-ocid="scanner.secondary_button"
          >
            <ClipboardCopy className="w-3 h-3 mr-2" />
            Copy Value
          </Button>
        </div>
      )}
    </div>
  );
}

export function Scanner() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Barcode & QR Scanner</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scan barcodes and QR codes using your camera or by uploading a
            photo.
          </p>
        </div>

        <Tabs defaultValue="live">
          <TabsList className="w-full mb-4">
            <TabsTrigger
              value="live"
              className="flex-1"
              data-ocid="scanner.tab"
            >
              <Camera className="w-4 h-4 mr-2" />
              Live Scan
            </TabsTrigger>
            <TabsTrigger
              value="photo"
              className="flex-1"
              data-ocid="scanner.tab"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Photo Scan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <LiveScanTab />
          </TabsContent>
          <TabsContent value="photo">
            <PhotoScanTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Scan line animation */}
      <style>{`
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
