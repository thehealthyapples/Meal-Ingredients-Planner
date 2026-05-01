import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { parseIngredient } from "@shared/parse-ingredient";
import {
  Sparkles, Loader2,
  Clock, X, RotateCcw, Mic, Camera, ImageUp, ChefHat, NotepadText,
} from "lucide-react";
import { CameraModal } from "@/components/camera-modal";
import { FirstVisitHint } from "@/components/first-visit-hint";
import thaAppleUrl from "@/assets/icons/tha-apple.png";
import RetailerLogo from "@/components/RetailerLogo";

// ── Constants ─────────────────────────────────────────────────────────────────

const SHOPS = [
  "Tesco", "Sainsbury's", "Morrisons", "Ocado",
  "Waitrose", "Asda", "Aldi", "Lidl",
];

const QUICK_LIST_KEY = "tha-quick-list-history";
const PENDING_LIST_KEY = "tha-pending-list-ingredients";
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function ListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [history, setHistory] = useState<QuickListBasket[]>(() => loadHistory());
  const [aiCleaned, setAiCleaned] = useState(false);

  useEffect(() => {
    document.title = "List – The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

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

  // ── Pick up ingredients passed back from Cookbook ─────────────────────────

  const pickUpPendingIngredients = useCallback(() => {
    try {
      const raw = localStorage.getItem(PENDING_LIST_KEY);
      if (!raw) return;
      localStorage.removeItem(PENDING_LIST_KEY);
      const parsed = JSON.parse(raw);

      let names: string[];
      if (Array.isArray(parsed)) {
        // Version 1: plain string array (fallback payload or old format)
        names = (parsed as string[]).filter(Boolean);
      } else if (parsed && parsed.version === 2 && Array.isArray(parsed.items)) {
        // Version 2: structured items from the parse endpoint
        names = parsed.items.map((item: { productName: string }) => item.productName).filter(Boolean);
      } else {
        return;
      }

      if (!names.length) return;
      const text = names.join("\n");
      setRawText((prev) => (prev ? `${prev}\n${text}` : text));
      setTimeout(resizeTextarea, 50);
      toast({
        title: `${names.length} ingredient${names.length !== 1 ? "s" : ""} added`,
        description: "From your Cookbook selection",
      });
    } catch {}
  }, [toast, resizeTextarea]);

  // Run on mount (handles navigating back from Cookbook in the same tab)
  useEffect(() => {
    pickUpPendingIngredients();
  }, [pickUpPendingIngredients]);

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
      // Attempt canonical server-side parse; fall back to inline parsing if it fails.
      let structuredItems: Array<{ productName: string; normalizedName: string; quantity: string | null; unit: string | null; category?: string; needsReview?: boolean }> | null = null;
      try {
        const parseRes = await apiRequest("POST", api.import.parse.path, {
          source: "speech",
          rawText,
          hint: "shopping_list",
        });
        if (!parseRes.ok) {
          console.warn("[ListPage] parse endpoint non-OK:", parseRes.status);
        } else {
          const json = await parseRes.json();
          structuredItems = Array.isArray(json?.items) ? json.items : null;
          if (json?.meta?.aiUsed === true) setAiCleaned(true);
          console.debug("[ListPage] parse endpoint returned", structuredItems?.length, "items");
        }
      } catch (parseErr) {
        console.warn("[ListPage] parse endpoint failed, using fallback:", parseErr);
      }

      // Build full structured item list from parse result or inline fallback.
      type StructuredItem = { productName: string; normalizedName: string; quantity: string | null; unit: string | null; category?: string; needsReview?: boolean };
      const allItems: StructuredItem[] = parsedItems.map((item, i) => {
        const s = structuredItems?.[i] ?? parseIngredient(item);
        return {
          productName: s.productName,
          normalizedName: s.normalizedName,
          quantity: s.quantity,
          unit: s.unit,
          category: 'category' in s ? (s as any).category as string | undefined : undefined,
          needsReview: 'needsReview' in s ? (s as any).needsReview as boolean | undefined : undefined,
        };
      });

      // Deduplicate by normalizedName: sum quantities when numeric + same unit, keep first otherwise.
      const merged = new Map<string, StructuredItem>();
      for (const item of allItems) {
        const existing = merged.get(item.normalizedName);
        if (!existing) {
          merged.set(item.normalizedName, { ...item });
          continue;
        }
        if (existing.quantity !== null && item.quantity !== null && existing.unit === item.unit) {
          const a = parseFloat(existing.quantity);
          const b = parseFloat(item.quantity);
          if (!isNaN(a) && !isNaN(b)) {
            merged.set(item.normalizedName, { ...existing, quantity: String(a + b) });
            continue;
          }
        }
        // Units differ, non-numeric, or one is null — keep first, discard duplicate.
      }

      // Insert deduplicated items.
      for (const item of Array.from(merged.values())) {
        // quantity from parseIngredient is a measurement string (e.g. "500", "2").
        // The DB `quantity` column is an integer count-of-packs (defaults to 1) — do not send.
        // Send measurement as quantityValue (real) + unit (text) instead.
        const quantityValue = item.quantity ? parseFloat(item.quantity) : undefined;
        await apiRequest("POST", api.shoppingList.add.path, {
          productName: item.productName,
          normalizedName: item.normalizedName,
          ...(quantityValue && !isNaN(quantityValue) ? { quantityValue } : {}),
          ...(item.unit ? { unit: item.unit } : {}),
          // Always send the category — including 'uncategorised' — so the add
          // route never runs keyword detection on an AI-generated name and
          // silently promotes a nonsense input to a real category.
          category: item.category || 'uncategorised',
          ...(item.needsReview ? { needsReview: true, validationNote: 'Item not confidently recognised — please verify' } : {}),
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

      const addedCount = merged.size;
      toast({
        title: `${addedCount} item${addedCount !== 1 ? "s" : ""} added`,
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-list-title">
          <NotepadText className="h-5 w-5 text-primary" />
          Quick List
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Popping to the shop? create a quick list here. The Healthy Apples will quickly help you choose better, effortlessly.
        </p>
      </div>

      {/* ── First-visit hint ─────────────────────────────────────────────── */}
      <FirstVisitHint
        areaKey="quick-list"
        message="Write your list naturally — THA will organise it, find better products, and guide you in-store."
      />

      {/* ── Writing surface ──────────────────────────────────────────────── */}
      <div
        className="w-full flex flex-col relative overflow-hidden"
        style={{
          backgroundImage: "url('/orchard-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 20,
          boxShadow: "0 4px 32px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)",
        }}
      >
        {/* Soft orchard tint overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.80)",
            borderRadius: 20,
            pointerEvents: "none",
          }}
        />

        {/* Content sits above the overlay */}
        <div className="relative z-10 flex flex-col">

          {/* Seamless textarea */}
          <div className="relative px-6 pt-6 pb-3">
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                resizeTextarea();
                if (aiCleaned) setAiCleaned(false);
              }}
              placeholder={"milk, eggs\noven chips\nbananas, yoghurt"}
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
                className="absolute top-6 right-6 p-1 rounded-md text-muted-foreground/35 hover:text-muted-foreground transition-colors"
                aria-label="Clear list"
                data-testid="button-clear-list"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Parsed item chips */}
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
                  {parseIngredient(item).productName}
                </span>
              ))}
              {aiCleaned && (
                <span
                  className="w-full mt-1 text-[11px]"
                  style={{ color: "hsl(var(--muted-foreground))", opacity: 0.7 }}
                >
                  We cleaned up a few items for you
                </span>
              )}
            </div>
          )}

          {/* Divider above toolbar */}
          <div
            style={{
              height: 1,
              background: "rgba(0,0,0,0.055)",
              marginInline: 24,
            }}
          />

          {/* Toolbar row */}
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

            {/* Cookbook */}
            <button
              onClick={() => navigate("/meals?from=list")}
              className="p-2 rounded-full text-muted-foreground/45 hover:text-foreground hover:bg-black/[0.05] transition-colors"
              title="Add ingredients from Cookbook"
              aria-label="Add ingredients from Cookbook"
              data-testid="button-open-cookbook"
            >
              <ChefHat className="h-4 w-4" />
            </button>

          </div>{/* end toolbar row */}

          {/* ── Send to shop (inline action bar) ──────────────────────────── */}
          {parsedItems.length > 0 && (
            <>
              {/* Divider matching the toolbar divider style */}
              <div
                style={{
                  height: 1,
                  background: "rgba(0,0,0,0.055)",
                  marginInline: 24,
                }}
              />

              <div className="px-3 pt-4 pb-3" data-testid="section-send-to-shop">
                {/* Auto-match primary action */}
                <button
                  onClick={() => processAndNavigate(null)}
                  disabled={isProcessing}
                  className="group flex items-center gap-3 w-full rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-3 text-left hover:bg-primary/[0.12] transition-colors disabled:opacity-60"
                  data-testid="button-best-shop"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/15 text-primary shrink-0">
                    {isProcessing
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary leading-tight">Auto-match shops</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Switch freely between stores in view</p>
                  </div>
                </button>

                {/* Store picker grid */}
                <div className="mt-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-black/[0.04]" />
                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">or choose a store</span>
                    <div className="h-px flex-1 bg-black/[0.04]" />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SHOPS.map((shop) => (
                      <button
                        key={shop}
                        onClick={() => processAndNavigate(shop)}
                        disabled={isProcessing}
                        className="flex flex-col items-center justify-center gap-1 rounded-lg p-1.5 hover:bg-black/[0.05] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        data-testid={`button-shop-${shop.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                      >
                        <RetailerLogo name={shop} size="h-5" />
                        <span className="text-[9px] font-medium text-foreground/50 text-center leading-tight">{shop}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>{/* end inner z-10 content */}
      </div>{/* end writing surface card */}

      {/* ── Recent lists ─────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <Clock className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground/40 select-none">
              Recent lists
            </span>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(253,251,246,0.88)",
              backdropFilter: "blur(6px)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            {history.map((basket, idx) => (
              <button
                key={basket.id}
                onClick={() => restoreFromHistory(basket)}
                className={`flex items-start justify-between gap-3 w-full px-4 py-3.5 text-left transition-colors hover:bg-black/[0.035] ${
                  idx > 0 ? "border-t border-black/[0.04]" : ""
                }`}
                data-testid={`history-item-${basket.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate text-foreground/80">
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

    </div>
  );
}
