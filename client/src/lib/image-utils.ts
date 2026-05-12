/**
 * Read a File or Blob as a base64 data URL using FileReader.
 *
 * Using FileReader instead of URL.createObjectURL avoids a known WebKit/WKWebView
 * bug where URL.createObjectURL can throw "The string did not match the expected
 * pattern." on certain iOS versions when called on a File with no or unusual MIME type.
 */
function readAsDataUrl(source: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(source);
  });
}

/**
 * Compress and resize a browser File or Blob to JPEG.
 * Scales down proportionally so neither dimension exceeds maxPx.
 * Returns a JPEG Blob ready for upload.
 *
 * Uses FileReader → data URL → canvas to avoid WebKit WKWebView bugs with
 * URL.createObjectURL on iOS.
 */
export async function compressImage(
  source: File | Blob,
  maxPx = 800,
  quality = 0.85
): Promise<Blob> {
  const dataUrl = await readAsDataUrl(source);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image encoding failed"));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Image load failed - format may not be supported"));

    img.src = dataUrl;
  });
}

/**
 * Infer MIME type from a filename extension.
 * Returns null if the extension is unrecognised.
 */
export function inferMimeFromFilename(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png":  return "image/png";
    case "webp": return "image/webp";
    case "heic": return "image/heic";
    case "heif": return "image/heif";
    default:     return null;
  }
}
