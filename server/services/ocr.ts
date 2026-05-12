import Tesseract from "tesseract.js";

export class OcrError extends Error {
  code: "OCR_FAILED" | "OCR_EMPTY" | "OCR_UNSUPPORTED";

  constructor(message: string, code: "OCR_FAILED" | "OCR_EMPTY" | "OCR_UNSUPPORTED") {
    super(message);
    this.name = "OcrError";
    this.code = code;
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const t0 = Date.now();
    const result = await Tesseract.recognize(buffer, "eng", {
      logger: () => {},
    });
    console.log(`[recipe-scan-timing] ocr-tesseract duration=${Date.now() - t0}ms`);

    const text = result.data.text.trim();

    if (!text || text.length < 3) {
      throw new OcrError(
        "No readable text found in image.",
        "OCR_EMPTY"
      );
    }

    return text;
  } catch (err) {
    if (err instanceof OcrError) throw err;
    throw new OcrError(
      "Failed to process image with OCR.",
      "OCR_FAILED"
    );
  }
}
