import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, RefreshCw, Loader2, AlertTriangle } from "lucide-react";

interface CameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  onUploadInstead: () => void;
}

export function CameraModal({ open, onOpenChange, onCapture, onUploadInstead }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<"loading" | "live" | "captured" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    stopStream();
    setStatus("loading");
    setErrorMsg("");
    setCapturedUrl(null);
    setCapturedFile(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStatus("live");
    } catch (err: any) {
      stopStream();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Camera access was denied. Please allow camera permission in your browser settings, or upload a file instead.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No camera found on this device. You can upload a file instead.");
      } else {
        setErrorMsg("Could not start the camera. You can upload a file instead.");
      }
      setStatus("error");
    }
  }, [stopStream]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      stopStream();
      setStatus("loading");
      setCapturedUrl(null);
      setCapturedFile(null);
      setErrorMsg("");
    }
    return () => { stopStream(); };
  }, [open]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], "scan-capture.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      setCapturedFile(file);
      setStatus("captured");
      stopStream();
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedFile(null);
    startCamera(facingMode);
  };

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const confirm = () => {
    if (!capturedFile) return;
    onCapture(capturedFile);
    onOpenChange(false);
  };

  const handleUploadInstead = () => {
    onOpenChange(false);
    setTimeout(() => onUploadInstead(), 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Recipe
          </DialogTitle>
          <DialogDescription>
            Point your camera at the recipe and take a photo, or upload an image.
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black aspect-video w-full overflow-hidden" data-testid="container-camera-preview">
          {status !== "captured" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${status === "live" ? "opacity-100" : "opacity-0"}`}
              data-testid="video-camera-feed"
            />
          )}

          {status === "captured" && capturedUrl && (
            <img
              src={capturedUrl}
              alt="Captured"
              className="w-full h-full object-contain"
              data-testid="img-camera-capture"
            />
          )}

          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <p className="text-sm text-white/80">{errorMsg}</p>
            </div>
          )}

          {status === "live" && (
            <button
              onClick={flipCamera}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
              title="Flip camera"
              data-testid="button-camera-flip"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="px-5 pb-5 pt-3 flex items-center gap-3">
          {status === "live" && (
            <>
              <Button
                onClick={takePhoto}
                className="flex-1"
                data-testid="button-camera-capture"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={handleUploadInstead}
                data-testid="button-camera-upload-instead"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
            </>
          )}

          {status === "captured" && (
            <>
              <Button onClick={confirm} className="flex-1" data-testid="button-camera-use-photo">
                Use this photo
              </Button>
              <Button variant="outline" onClick={retake} data-testid="button-camera-retake">
                Retake
              </Button>
            </>
          )}

          {status === "error" && (
            <Button
              variant="outline"
              onClick={handleUploadInstead}
              className="flex-1"
              data-testid="button-camera-upload-fallback"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload file instead
            </Button>
          )}

          {status === "loading" && (
            <Button variant="outline" className="flex-1" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting camera…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
