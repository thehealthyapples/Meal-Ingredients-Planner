import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { X, Flashlight, FlashlightOff } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Camera constraints used by both decode paths.
// facingMode: { ideal: 'environment' } reliably selects the rear camera on
// all mobile browsers without relying on device-label heuristics (which fail
// on iOS until camera permission is already granted).
const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

// ZXing formats: EAN-13, UPC-A, UPC-E only.
// Removing EAN-8 reduces decode work — supermarket products don't use it.
const ZXING_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

// BarcodeDetector API uses lowercase format strings.
const NATIVE_FORMATS = ["ean_13", "upc_a", "upc_e"];

// Preserve the UPC-A → EAN-13 normalisation fix: UPC-A (12 digits) needs a
// leading '0' prepended to match the 13-digit EAN-13 code stored in OFF.
function normaliseBarcode(rawText: string, formatName: string): string {
  if (
    (formatName === "upc_a" || formatName === "UPC_A") &&
    rawText.length === 12
  ) {
    return "0" + rawText;
  }
  return rawText;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  isOpen,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasScannedRef = useRef(false);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopScanning = useCallback(() => {
    hasScannedRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    torchTrackRef.current = null;
    setTorchAvailable(false);
    setTorchOn(false);
  }, []);

  // Probe the video stream for torch support and store the track reference.
  // Called once the camera stream is live.
  const probeTorch = useCallback((stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    torchTrackRef.current = track;
    const capabilities = (track as any).getCapabilities?.() ?? {};
    if (capabilities.torch) {
      setTorchAvailable(true);
      console.log("[SCAN-CAMERA] torch=available");
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = torchTrackRef.current;
    if (!track) return;
    try {
      const next = !torchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      // Torch reported as available but applyConstraints failed — ignore.
    }
  }, [torchOn]);

  const handleResult = useCallback(
    (rawText: string, formatName: string) => {
      if (hasScannedRef.current) return;
      const normalised = normaliseBarcode(rawText, formatName);
      const expanded = normalised !== rawText;
      console.log(
        `[SCAN-FRONTEND] raw="${rawText}" format=${formatName}` +
          ` normalised="${normalised}" upc_a_expanded=${expanded}`
      );
      hasScannedRef.current = true;
      onScan(normalised);
    },
    [onScan]
  );

  const initializeScanner = useCallback(async () => {
    if (!isOpen || !videoRef.current) return;

    setIsInitializing(true);
    setError(null);

    const useNative =
      typeof (window as any).BarcodeDetector !== "undefined";
    console.log(`[SCAN-INIT] native_BarcodeDetector=${useNative}`);

    try {
      if (useNative) {
        // ── Native BarcodeDetector path ────────────────────────────────────
        // Available on Chrome Android ≥90 and Safari iOS 17+.
        // Hardware-accelerated: significantly faster than ZXing JS decoding.
        const detector = new (window as any).BarcodeDetector({
          formats: NATIVE_FORMATS,
        });

        const stream = await navigator.mediaDevices.getUserMedia(
          VIDEO_CONSTRAINTS
        );
        probeTorch(stream);

        const video = videoRef.current;
        video.setAttribute("playsinline", "true");
        video.srcObject = stream;
        await video.play();

        const DETECT_INTERVAL_MS = 120; // ~8 fps — sufficient for 1D barcodes
        let lastDetectTime = 0;

        const detect = async (now: number) => {
          if (hasScannedRef.current) return;
          if (
            now - lastDetectTime >= DETECT_INTERVAL_MS &&
            video.readyState >= video.HAVE_ENOUGH_DATA
          ) {
            lastDetectTime = now;
            try {
              const barcodes: Array<{ rawValue: string; format: string }> =
                await detector.detect(video);
              if (barcodes.length > 0) {
                handleResult(barcodes[0].rawValue, barcodes[0].format);
                return;
              }
            } catch {
              // Normal: frame decode failed (e.g. video not ready). Continue.
            }
          }
          rafRef.current = requestAnimationFrame(detect);
        };
        rafRef.current = requestAnimationFrame(detect);
        setIsInitializing(false);
      } else {
        // ── ZXing fallback path ────────────────────────────────────────────
        // Used on browsers without BarcodeDetector (older Safari, Firefox).
        console.log("[SCAN-INIT] ZXing fallback");

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);
        // TRY_HARDER improves lock-on for partially obscured or angled 1D barcodes.
        hints.set(DecodeHintType.TRY_HARDER, true);

        // delayBetweenScanAttempts default is 500 ms (2 attempts/sec — too slow).
        // 150 ms gives ~6-7 attempts/sec without excessive CPU.
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 500,
        });

        // decodeFromConstraints passes facingMode/resolution directly to
        // getUserMedia, replacing the unreliable device-label camera selection.
        const controls = await reader.decodeFromConstraints(
          VIDEO_CONSTRAINTS,
          videoRef.current,
          (result, _err, _controls) => {
            if (!result) return;
            const rawText = result.getText();
            if (!rawText) return;
            // Probe torch once the stream is live (first successful frame).
            if (!torchTrackRef.current && videoRef.current?.srcObject) {
              probeTorch(videoRef.current.srcObject as MediaStream);
            }
            handleResult(rawText, BarcodeFormat[result.getBarcodeFormat()]);
          }
        );

        controlsRef.current = controls;
        setIsInitializing(false);
      }
    } catch (err) {
      let errorMessage = "Failed to access camera";
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.message.includes("Permission denied")
        ) {
          errorMessage = "Camera permission denied. Please allow camera access.";
        } else if (
          err.name === "NotFoundError" ||
          err.message.includes("No camera found")
        ) {
          errorMessage = "No camera available";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setIsInitializing(false);
    }
  }, [isOpen, handleResult, probeTorch]);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen, initializeScanner, stopScanning]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4"
      data-testid="modal-barcode-scanner"
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-4 right-4 text-white"
        data-testid="button-close-scanner"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        {/* 4:3 container — wider than square, matches camera output better for
            horizontal barcodes without going full 16:9 landscape. */}
        <div className="relative w-full overflow-hidden rounded-lg shadow-2xl" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            data-testid="video-barcode-scanner"
          />

          {/* Scan overlay: narrow horizontal strip guides the user to hold
              the barcode horizontally, which is the natural orientation for
              EAN-13 / UPC-A linear barcodes. */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-4/5" style={{ height: "28%" }}>
              {/* Corner marks */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400/90" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400/90" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400/90" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400/90" />
              {/* Scan line */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  style={{ animation: "scan 1.5s ease-in-out infinite" }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {isInitializing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
            </div>
          )}
        </div>

        {!error && (
          <p className="text-center text-white text-sm">
            Align barcode within the frame
          </p>
        )}

        {torchAvailable && !error && (
          <Button
            size="sm"
            variant="outline"
            onClick={toggleTorch}
            className="text-white border-white/50 gap-2"
            data-testid="button-torch"
          >
            {torchOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
            {torchOn ? "Torch off" : "Torch"}
          </Button>
        )}

        {error && (
          <Button
            onClick={onClose}
            variant="outline"
            className="text-white border-white"
          >
            Close
          </Button>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%   { transform: translateY(0);    opacity: 0.5; }
          50%  { opacity: 1; }
          100% { transform: translateY(550%); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
