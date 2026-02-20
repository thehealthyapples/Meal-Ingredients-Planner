import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  isOpen,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const initializeScanner = useCallback(async () => {
    if (!isOpen || !videoRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);

      const reader = new BrowserMultiFormatReader(hints);

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setError("No camera available on this device");
        setIsInitializing(false);
        return;
      }

      let selectedDeviceId = videoInputDevices[0].deviceId;
      if (videoInputDevices.length > 1) {
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear")
        );
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId;
        }
      }

      const controls = await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (result && result.getText()) {
            const barcode = result.getText();
            onScan(barcode);
          }
        }
      );

      controlsRef.current = controls;
      setIsInitializing(false);
    } catch (err) {
      let errorMessage = "Failed to access camera";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.message.includes("Permission denied")) {
          errorMessage = "Camera permission denied. Please allow camera access.";
        } else if (err.name === "NotFoundError" || err.message.includes("No camera found")) {
          errorMessage = "No camera available";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setIsInitializing(false);
    }
  }, [isOpen, onScan]);

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
        <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-2xl">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            data-testid="video-barcode-scanner"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-4/5 h-4/5">
              <div className="absolute inset-0 border-2 border-transparent pointer-events-none">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400/80" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400/80" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400/80" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400/80" />
              </div>

              <div className="absolute inset-0 overflow-hidden rounded-sm">
                <div
                  className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  style={{ animation: "scan 2s linear infinite", top: "50%" }}
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
            Point camera at barcode
          </p>
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
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
