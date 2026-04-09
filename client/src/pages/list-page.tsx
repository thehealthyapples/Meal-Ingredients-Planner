import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { normalizeIngredientKey } from "@shared/normalize";
import {
  Store, Sparkles, ChevronRight, Loader2,
  Clock, X, RotateCcw, Mic, Camera, ImageUp, ArrowLeft,
} from "lucide-react";
import { CameraModal } from "@/components/camera-modal";
import thaAppleUrl from "@/assets/icons/tha-apple.png";
import RetailerLogo from "@/components/RetailerLogo";

// ── Constants ─────────────────────────────────────────────────────────────────

const SHOPS = [
  "Tesco", "Sainsbury's", "Morrisons", "Ocado",
  "Waitrose", "Asda", "Aldi", "Lidl",
];

const QUICK_LIST_KEY = "tha-quick-list-history";
const MAX_HISTORY = 4;

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuickListBasket {
  id: string;
  rawText: string;
  parsedItems: string[];
  selectedShop: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function loadHistory(): QuickListBasket[] {
  try {
    return JSON.parse(localStorage.getItem(QUICK_LIST_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(basket: QuickListBasket) {
  try {
    const existing = loadHistory();
    const updated = [basket, ...existing.filter((b) => b.id !== basket.id)].slice(0, MAX_HISTORY);
    localStorage.setItem(QUICK_LIST_KEY, JSON.stringify(updated));
  } catch {}
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Inline SVG logos — no external dependency, works offline.


// ── Component ─────────────────────────────────────────────────────────────────

export default function ListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [rawText, setRawText] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shopPickerOpen, setShopPickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [history, setHistory] = useState<QuickListBasket[]>(() => loadHistory());

  useEffect(() => {
    document.title = "List – The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Stop recognition on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const parsedItems = parseList(rawText);

  // ── Auto-resize textarea ──────────────────────────────────────────────────

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // ── Speech input ──────────────────────────────────────────────────────────

  const toggleSpeech = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      toast({ title: "Voice input not supported", description: "Try Chrome or Safari on iOS." });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-GB";

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);

    rec.onresult = (e: any) => {
      const spoken = Array.from(e.results as SpeechRecognitionResultList)
        .slice(e.resultIndex)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript.trim())
        .join("\n");
      if (spoken) {
        setRawText((prev) => (prev ? `${prev}\n${spoken}` : spoken));
        setTimeout(resizeTextarea, 0);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isListening, toast, resizeTextarea]);

  // ── Camera / file OCR ────────────────────────────────────────────────────

  const handleImageCapture = useCallback(async (file: File) => {
    setIsScanning(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/scan", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      // Use rawText regardless of whether the OCR parser detected a recipe or
      // meal plan — for a shopping list the result is usually "unknown" and
      // rawText contains the extracted lines.
      const extracted: string =
        data.rawText ?? (data.parsed as any)?.rawText ?? "";
      if (extracted.trim()) {
        setRawText((prev) =>
          prev ? `${prev}\n${extracted.trim()}` : extracted.trim()
        );
        setTimeout(resizeTextarea, 0);
        toast({ title: "List scanned", description: "Text added — edit freely." });
      } else {
        toast({
          title: "Nothing readable",
          description: "Try a clearer or closer photo.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Scan failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  }, [toast, resizeTextarea]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageCapture(file);
      e.target.value = "";
    },
    [handleImageCapture]
  );

  // ── Navigate to shop view ─────────────────────────────────────────────────

  const processAndNavigate = async (shop: string | null) => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);

    const basketId = Date.now().toString();
    const basketLabel = `quick_list_${basketId}`;

    try {
      for (const item of parsedItems) {
        await apiRequest("POST", api.shoppingList.add.path, {
          productName: item,
          normalizedName: normalizeIngredientKey(item),
          basketLabel,
        });
      }

      try {
        await fetch(api.shoppingList.autoSmp.path, { method: "POST", credentials: "include" });
      } catch { /* non-fatal */ }

      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });

      const basket: QuickListBasket = {
        id: basketId,
        rawText,
        parsedItems,
        selectedShop: shop,
        createdAt: new Date().toISOString(),
      };
      saveToHistory(basket);
      setHistory(loadHistory());

      const navParams = new URLSearchParams({ quickList: basketLabel, shopMode: "1" });
      if (shop) navParams.set("store", shop);
      navigate(`/analyse-basket?${navParams.toString()}`);

      toast({
        title: `${parsedItems.length} item${parsedItems.length !== 1 ? "s" : ""} added`,
        description: shop ? `Opening ${shop}…` : "Opening shop view…",
      });
    } catch (err: any) {
      console.error("[ListPage] processAndNavigate error:", err);
      toast({
        title: "Failed to process list",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const restoreFromHistory = (basket: QuickListBasket) => {
    setRawText(basket.rawText);
    setTimeout(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    }, 50);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 pt-6 pb-10 flex flex-col items-center">

        {/* ── Writing surface ────────────────────────────────────────────── */}
        <div
          className="w-full max-w-lg flex flex-col relative overflow-hidden"
          style={{
            backgroundImage: "url('/orchard-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 20,
            boxShadow:
              "0 4px 32px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          {/* Faint orchard wash — white overlay to push bg into the background */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.82)",
              borderRadius: 20,
              pointerEvents: "none",
            }}
          />

          {/* All content sits above the overlay */}
          <div className="relative z-10 flex flex-col">

          {/* Brand header */}
          <div className="px-6 pt-6 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <img
                src={thaAppleUrl}
                width={40}
                height={40}
                alt="THA"
                style={{ opacity: 0.85 }}
                draggable={false}
              />
              <span className="text-[10px] tracking-widest uppercase font-medium text-foreground/60 select-none">
                The Healthy Apples
              </span>
            </div>
            <p className="text-[13px] text-foreground/55 leading-snug italic">
              Write what you need — THA will help you shop smarter.
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(0,0,0,0.06)",
              marginInline: 24,
            }}
          />

          {/* Seamless textarea — text appears directly on the paper */}
          <div className="relative px-6 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                resizeTextarea();
              }}
              placeholder={"milk, eggs\noven chips\nbananas, yoghurt\npasta sauce"}
              rows={8}
              className="w-full resize-none bg-transparent text-[15px] leading-loose placeholder:text-foreground/25 placeholder:italic focus:outline-none text-foreground font-medium"
              style={{ minHeight: 180 }}
              data-testid="textarea-quick-list"
            />
            {rawText.length > 0 && (
              <button
                onClick={() => {
                  setRawText("");
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                  }
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="absolute top-4 right-6 p-1 rounded-md text-muted-foreground/35 hover:text-muted-foreground transition-colors"
                aria-label="Clear list"
                data-testid="button-clear-list"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Parsed item chips — inside the card, below the writing area */}
          {parsedItems.length > 0 && (
            <div
              className="px-6 pb-3 flex flex-wrap gap-1.5"
              data-testid="parsed-items-preview"
            >
              {parsedItems.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: "rgba(0,0,0,0.055)",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* Divider above tools */}
          <div
            style={{
              height: 1,
              background: "rgba(0,0,0,0.055)",
              marginInline: 24,
            }}
          />

          {/* Tools row + CTA */}
          <div className="px-5 py-3.5 flex items-center gap-1">

            {/* Speech */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? "bg-red-50 text-red-500"
                  : "text-muted-foreground/45 hover:text-foreground hover:bg-black/[0.05]"
              }`}
              title={isListening ? "Stop listening" : "Speak your list"}
              aria-label={isListening ? "Stop listening" : "Speak your list"}
              data-testid="button-speech-input"
            >
              <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
            </button>

            {/* Camera scan */}
            <button
              onClick={() => setCameraOpen(true)}
              disabled={isScanning}
              className="p-2 rounded-full text-muted-foreground/45 hover:text-foreground hover:bg-black/[0.05] transition-colors disabled:opacity-30"
              title="Scan a handwritten list"
              aria-label="Scan a handwritten list"
              data-testid="button-camera-scan"
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>

            {/* Photo upload */}
            <label
              className="p-2 rounded-full text-muted-foreground/45 hover:text-foreground hover:bg-black/[0.05] transition-colors cursor-pointer"
              title="Upload a photo of your list"
              aria-label="Upload a photo of your list"
              data-testid="label-image-upload"
            >
              <ImageUp className="h-4 w-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                data-testid="input-image-upload"
              />
            </label>

            <div className="flex-1" />

            {/* Primary CTA — lives inside the writing surface */}
            <Button
              size="sm"
              className="gap-1.5 font-semibold px-4 h-9"
              disabled={parsedItems.length === 0 || isProcessing}
              onClick={() => setSheetOpen(true)}
              data-testid="button-create-shop-list"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Store className="h-3.5 w-3.5" />
              )}
              {isProcessing
                ? "Building…"
                : parsedItems.length > 0
                ? `Shop · ${parsedItems.length}`
                : "Shop list"}
            </Button>
          </div>
          </div>{/* end z-10 content wrapper */}
        </div>

        {/* ── Recent lists ──────────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="mt-6 w-full max-w-lg">
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <Clock className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground/40 select-none">
                Recent
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {history.map((basket) => (
                <button
                  key={basket.id}
                  onClick={() => restoreFromHistory(basket)}
                  className="flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:brightness-95"
                  style={{
                    background: "rgba(253,251,246,0.82)",
                    backdropFilter: "blur(6px)",
                  }}
                  data-testid={`history-item-${basket.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate text-foreground/75">
                      {basket.parsedItems.slice(0, 4).join(", ")}
                      {basket.parsedItems.length > 4 &&
                        ` +${basket.parsedItems.length - 4} more`}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                      {basket.parsedItems.length} item
                      {basket.parsedItems.length !== 1 ? "s" : ""}
                      {basket.selectedShop
                        ? ` · ${basket.selectedShop}`
                        : " · Best shop"}
                      {" · "}
                      {formatRelativeTime(basket.createdAt)}
                    </p>
                  </div>
                  <RotateCcw className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Camera modal ─────────────────────────────────────────────────── */}
      <CameraModal
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(file) => {
          setCameraOpen(false);
          handleImageCapture(file);
        }}
        onUploadInstead={() => fileInputRef.current?.click()}
      />

      {/* ── Dialog: Where are you shopping? ── */}
      <Dialog
        open={sheetOpen}
        onOpenChange={(v) => { if (!isProcessing) setSheetOpen(v); }}
      >
        <DialogContent className="max-w-sm" data-testid="sheet-shop-choice">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <img src={thaAppleUrl} width={20} height={20} alt="" draggable={false} style={{ opacity: 0.8 }} />
              <DialogTitle className="text-base font-semibold">Where are you shopping?</DialogTitle>
            </div>
            <DialogDescription className="text-[13px]">
              Pick your store and THA will guide you through the healthiest choices.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 mt-1">
            {/* Choose a store */}
            <button
              onClick={() => { setSheetOpen(false); setShopPickerOpen(true); }}
              className="group flex items-center gap-3.5 w-full rounded-xl border border-border bg-card px-4 py-3.5 text-left hover:border-primary/40 hover:bg-accent/30 transition-colors"
              data-testid="button-choose-shop"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-foreground shrink-0">
                <Store className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">Choose a store</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pick exactly where you're heading</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-foreground transition-colors" />
            </button>

            {/* Auto-match */}
            <button
              onClick={() => { setSheetOpen(false); processAndNavigate(null); }}
              disabled={isProcessing}
              className="group flex items-center gap-3.5 w-full rounded-xl border border-primary/40 bg-primary/[0.06] px-4 py-3.5 text-left hover:bg-primary/[0.12] transition-colors disabled:opacity-60"
              data-testid="button-best-shop"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/15 text-primary shrink-0">
                {isProcessing
                  ? <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  : <Sparkles className="h-4.5 w-4.5" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary leading-tight">Auto-match shops</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Switch freely between stores in view
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-primary/40 shrink-0 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Choose your shop ── */}
      <Dialog
        open={shopPickerOpen}
        onOpenChange={(v) => { if (!isProcessing) setShopPickerOpen(v); }}
      >
        <DialogContent className="max-w-sm" data-testid="sheet-shop-picker">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShopPickerOpen(false); setSheetOpen(true); }}
                className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <DialogTitle className="text-base font-semibold">Choose your store</DialogTitle>
            </div>
            <DialogDescription className="text-[13px]">
              THA will show you the healthiest picks for that store.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-3 mt-1 pb-1">
            {SHOPS.map((shop) => (
              <button
                key={shop}
                onClick={() => { setShopPickerOpen(false); processAndNavigate(shop); }}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-testid={`button-shop-${shop.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                <RetailerLogo name={shop} size="h-7" />
                <span className="text-[11px] font-medium text-foreground/70 text-center leading-tight">
                  {shop}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
