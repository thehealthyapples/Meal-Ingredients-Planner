import { useRef, useState } from "react";
import { Loader2, Camera, Wand2, ImageOff, MoreHorizontal, Images, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { MealWatermark } from "@/components/meal-watermark";
import { buildUrl, api } from "@shared/routes";
import { compressImage, inferMimeFromFilename } from "@/lib/image-utils";

// Display images are decorative - they do not imply recipe correctness.
// This component has no connection to recipe scan or extraction.

interface MealImageWidgetProps {
  mealId: number;
  imageUrl?: string | null;
  mealName: string;
  audience?: string | null;
  isSystemMeal?: boolean;
  canEdit: boolean;
  onImageChange: (mealId: number, newImageUrl: string | null) => void;
}

type LoadingAction = "upload" | "generate" | "remove" | null;

// iOS sometimes reports HEIC photos with an empty MIME type, or as image/heic.
// We pass these through to compression; if that fails the server handles the
// reject-with-helpful-message path for HEIC, and accepts JPEG with wrong type.
const CLIENT_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "", // iOS bug: some files arrive with empty type
]);

/**
 * Build the File to upload.
 *
 * Strategy:
 *  1. Try client-side compression → always produces a small JPEG.
 *  2. If compression throws (e.g. canvas can't decode HEIC, or WKWebView
 *     URL-object bug), fall back to uploading the original file unchanged.
 *     The server is responsible for rejecting formats it can't display.
 *
 * Returns `{ file, compressed }` so the caller can log which path was taken.
 */
async function buildUploadFile(
  original: File
): Promise<{ file: File; compressed: boolean }> {
  try {
    const blob = await compressImage(original, 800, 0.85);
    const compressed = new File([blob], "meal-photo.jpg", { type: "image/jpeg" });
    console.log(
      `[image-upload] compressed OK: original="${original.name}" ` +
      `type="${original.type}" originalSize=${original.size}B compressedSize=${compressed.size}B`
    );
    return { file: compressed, compressed: true };
  } catch (compressErr) {
    // Compression failed - common on iPhone for HEIC or when WKWebView's
    // URL.createObjectURL throws "The string did not match the expected pattern."
    console.warn(
      `[image-upload] compression failed (fallback to original): ` +
      `name="${original.name}" type="${original.type}" size=${original.size}B ` +
      `error="${(compressErr as Error)?.message}"`
    );

    // Determine the best MIME type for the original file.
    // iOS sometimes reports type="" even for a valid JPEG; infer from filename.
    const effectiveType =
      original.type ||
      inferMimeFromFilename(original.name) ||
      "image/jpeg";

    const fallback = new File([original], original.name || "upload.jpg", {
      type: effectiveType,
    });
    return { file: fallback, compressed: false };
  }
}

export function MealImageWidget({
  mealId,
  imageUrl,
  mealName,
  audience,
  isSystemMeal,
  canEdit,
  onImageChange,
}: MealImageWidgetProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<LoadingAction>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  const busy = loading !== null;

  // ── Upload / replace ────────────────────────────────────────────────────────

  const triggerFileInput = () => {
    if (busy) return;
    setPopoverOpen(false);
    // Small delay so the popover closes before the file picker opens (iOS needs this)
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const triggerCamera = () => {
    setPhotoSheetOpen(false);
    setTimeout(() => cameraInputRef.current?.click(), 50);
  };

  const triggerGallery = () => {
    setPhotoSheetOpen(false);
    setTimeout(() => galleryInputRef.current?.click(), 50);
  };

  const triggerFileFromSheet = () => {
    setPhotoSheetOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const triggerGenerateFromSheet = () => {
    setPhotoSheetOpen(false);
    handleGenerate();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!CLIENT_ALLOWED_TYPES.has(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose an image under 20 MB.",
      });
      return;
    }

    console.log(
      `[image-upload] selected: name="${file.name}" type="${file.type}" size=${file.size}B`
    );

    setLoading("upload");
    try {
      const { file: uploadFile, compressed } = await buildUploadFile(file);

      const formData = new FormData();
      formData.append("image", uploadFile);

      const uploadRes = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}));
        throw new Error((errBody as any).message || "Upload failed");
      }

      const { url } = await uploadRes.json();
      console.log(`[image-upload] uploaded OK: url="${url}" compressed=${compressed}`);

      const patchRes = await fetch(buildUrl(api.meals.updateImage.path, { id: mealId }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!patchRes.ok) throw new Error("Could not save image to recipe.");

      const updated = await patchRes.json();
      onImageChange(mealId, updated.imageUrl ?? url);
      toast({ title: "Photo saved" });
    } catch (err: any) {
      const raw: string = err?.message ?? "";
      // Translate obscure WebKit/WKWebView errors to actionable messages.
      let description: string;
      if (raw.includes("did not match") || raw.includes("expected pattern")) {
        description = "Could not read the photo. Please try again or choose a different image.";
      } else if (raw.includes("HEIC") || raw.toLowerCase().includes("not supported yet")) {
        description = raw; // server already returns a friendly HEIC message
      } else {
        description = raw || "Please try again.";
      }
      toast({ variant: "destructive", title: "Upload failed", description });
    } finally {
      setLoading(null);
    }
  };

  // ── Generate AI image ───────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (busy) return;
    setLoading("generate");
    setPopoverOpen(false);
    try {
      const res = await fetch(buildUrl(api.meals.generateImage.path, { id: mealId }), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Generation failed");
      }
      const updated = await res.json();
      onImageChange(mealId, updated.imageUrl ?? null);
      toast({ title: "AI image generated" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Image generation failed",
        description: err?.message || "Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  // ── Remove image ────────────────────────────────────────────────────────────

  const handleRemove = async () => {
    if (busy) return;
    setLoading("remove");
    setPopoverOpen(false);
    try {
      const res = await fetch(buildUrl(api.meals.updateImage.path, { id: mealId }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl: null }),
      });
      if (!res.ok) throw new Error("Could not remove image.");
      onImageChange(mealId, null);
      toast({ title: "Image removed" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: err?.message || "Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  // ── Watermarks ──────────────────────────────────────────────────────────────

  const watermark =
    audience === "baby" ? (
      <MealWatermark type="baby" size="md" className="bottom-2 right-2" />
    ) : audience === "child" ? (
      <MealWatermark type="child" size="md" className="bottom-2 right-2" />
    ) : !isSystemMeal && audience !== "baby" && audience !== "child" ? (
      <MealWatermark type="adult" size="md" className="bottom-2 right-2" />
    ) : null;

  // ── Shared action menu ───────────────────────────────────────────────────────

  const actionMenu = (
    <div className="flex flex-col gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-xs h-8 w-full"
        onClick={triggerFileInput}
        data-testid={`button-image-replace-${mealId}`}
      >
        <Camera className="h-3.5 w-3.5 mr-2" />
        {imageUrl ? "Replace photo" : "Add photo"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-xs h-8 w-full"
        onClick={handleGenerate}
        disabled={busy}
        data-testid={`button-image-regenerate-${mealId}`}
      >
        <Wand2 className="h-3.5 w-3.5 mr-2" />
        {imageUrl ? "Regenerate AI image" : "Generate AI image"}
      </Button>
      {imageUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-xs h-8 w-full text-destructive hover:text-destructive"
          onClick={handleRemove}
          disabled={busy}
          data-testid={`button-image-remove-${mealId}`}
        >
          <ImageOff className="h-3.5 w-3.5 mr-2" />
          Remove photo
        </Button>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="relative w-full h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={handleFileSelected}
        data-testid={`input-meal-photo-${mealId}`}
      />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />

      {imageUrl ? (
        <>
          {/* PX1-W3 (fnd-px-images-not-lazy): 48 cards render at once and every
              photo loaded eagerly at full resolution. The container sizes the
              image (w-full h-full), so lazy/async cannot shift layout. srcset
              needs server-side resizing that does not exist yet — recorded in
              the W3 doc, not silently skipped. */}
          <img
            src={imageUrl}
            alt={mealName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            data-testid={`img-meal-${mealId}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {watermark}

          {/* Tap-anywhere trigger: transparent overlay covers the whole image.
              Always mounted when canEdit so mobile users can tap the image to
              open photo actions (no hover required). The ⋯ badge at bottom-right
              hints that the area is interactive. stopPropagation prevents the
              parent card's onClick from firing when the image is tapped. */}
          {/* Desktop only: tap-anywhere popover for photo management */}
          {canEdit && (
            <div className="hidden sm:block">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="absolute inset-0 z-20 w-full h-full bg-transparent border-0 p-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Manage photo"
                    data-testid={`button-image-manage-${mealId}`}
                  >
                    {/* Always-visible ⋯ indicator */}
                    <div className="absolute bottom-1.5 right-1.5 h-7 w-7 bg-black/45 hover:bg-black/70 rounded-md flex items-center justify-center text-white transition-colors pointer-events-none">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-44 p-1"
                  side="top"
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actionMenu}
                </PopoverContent>
              </Popover>
            </div>
          )}
        </>
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 px-3 bg-accent/30"
          data-testid={`placeholder-meal-${mealId}`}
        >
          {audience === "baby" ? (
            <MealWatermark type="baby" size="lg" className="relative" />
          ) : audience === "child" ? (
            <MealWatermark type="child" size="lg" className="relative" />
          ) : (
            <>
              <Wand2 className="h-8 w-8 text-muted-foreground/30 relative z-10" />
              {!isSystemMeal && (
                <MealWatermark type="adult" size="lg" className="inset-0 m-auto absolute" />
              )}
            </>
          )}
          <span className="text-sm font-semibold text-center leading-tight relative z-10 text-foreground line-clamp-2 px-1">
            {mealName}
          </span>
          {canEdit && (
            <>
              {/* Mobile: single Add photo button → opens action sheet */}
              <div className="sm:hidden flex relative z-10" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 bg-background/80"
                  onClick={() => setPhotoSheetOpen(true)}
                  disabled={busy}
                  data-testid={`button-upload-photo-${mealId}`}
                >
                  <Camera className="h-3 w-3" />
                  Add photo
                </Button>
              </div>
              {/* Desktop: original two-button layout unchanged */}
              <div className="hidden sm:flex gap-1.5 relative z-10" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 bg-background/80"
                  onClick={triggerFileInput}
                  disabled={busy}
                  data-testid={`button-upload-photo-${mealId}-desktop`}
                >
                  <Camera className="h-3 w-3" />
                  Add photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 bg-background/50"
                  onClick={handleGenerate}
                  disabled={busy}
                  data-testid={`button-generate-image-${mealId}`}
                >
                  {loading === "generate" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  {loading === "generate" ? "Generating…" : "Generate"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Loading overlay - shown during any image action */}
      {busy && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-30">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-white text-xs">
            {loading === "generate"
              ? "Generating…"
              : loading === "remove"
              ? "Removing…"
              : "Uploading…"}
          </span>
        </div>
      )}
    </div>

    {/* Mobile photo action sheet — opened by Add photo on placeholder cards */}
    <Drawer open={photoSheetOpen} onOpenChange={setPhotoSheetOpen} shouldScaleBackground={false}>
      <DrawerContent
        className="flex flex-col"
        data-testid={`drawer-photo-actions-${mealId}`}
      >
        <div className="px-4 pt-1 pb-3 shrink-0">
          <DrawerTitle className="text-sm font-semibold">Add image</DrawerTitle>
        </div>
        <div className="w-full h-px bg-border/50" />
        <div
          className="flex flex-col gap-0 pb-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-accent/40 active:bg-accent/60 transition-colors"
            onClick={triggerGenerateFromSheet}
            disabled={busy}
            data-testid={`button-sheet-generate-${mealId}`}
          >
            <Wand2 className="h-4 w-4 text-primary/70 shrink-0" />
            Generate image
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-accent/40 active:bg-accent/60 transition-colors"
            onClick={triggerGallery}
            disabled={busy}
            data-testid={`button-sheet-gallery-${mealId}`}
          >
            <Images className="h-4 w-4 text-primary/70 shrink-0" />
            Photo library
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-accent/40 active:bg-accent/60 transition-colors"
            onClick={triggerCamera}
            disabled={busy}
            data-testid={`button-sheet-camera-${mealId}`}
          >
            <Camera className="h-4 w-4 text-primary/70 shrink-0" />
            Take photo
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-accent/40 active:bg-accent/60 transition-colors"
            onClick={triggerFileFromSheet}
            disabled={busy}
            data-testid={`button-sheet-file-${mealId}`}
          >
            <Upload className="h-4 w-4 text-primary/70 shrink-0" />
            Choose file
          </button>
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}
