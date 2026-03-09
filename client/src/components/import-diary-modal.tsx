import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";

const THA_FIELDS = [
  { value: "date", label: "Date" },
  { value: "weightKg", label: "Weight (kg)" },
  { value: "sleepHours", label: "Sleep (hours)" },
  { value: "moodApples", label: "Mood (1–5)" },
  { value: "energyApples", label: "Energy (1–5)" },
  { value: "notes", label: "Notes" },
  { value: "stuckToPlan", label: "Stuck to Plan" },
  { value: "calories", label: "Calories" },
  { value: "mealSlot", label: "Meal Slot" },
  { value: "entryName", label: "Entry Name" },
  { value: "(ignore)", label: "(Ignore)" },
] as const;

type ThaField = typeof THA_FIELDS[number]["value"];

type Step = "instructions" | "upload" | "preview" | "strategy" | "validation" | "result";

interface ParsedData {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

interface ValidationResult {
  validRows: Record<string, unknown>[];
  invalidRows: { row: Record<string, unknown>; errors: string[] }[];
}

interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
}

function detectDelimiter(line: string): string {
  const counts = {
    ",": (line.match(/,/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
    "|": (line.match(/\|/g) || []).length,
  };
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : ",";
}

function parseFile(text: string): ParsedData {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")),
  );
  return { headers, delimiter, rows };
}

function autoMap(headers: string[]): Record<string, ThaField> {
  const fieldNames = THA_FIELDS.map((f) => f.value);
  const map: Record<string, ThaField> = {};
  for (const h of headers) {
    const lower = h.toLowerCase();
    const match = fieldNames.find((f) => f.toLowerCase() === lower);
    map[h] = (match as ThaField) ?? "(ignore)";
  }
  return map;
}

function buildMappedRows(
  headers: string[],
  rows: string[][],
  columnMap: Record<string, ThaField>,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      const field = columnMap[header];
      if (!field || field === "(ignore)") return;
      const val = row[i] ?? "";
      if (val === "") return;
      obj[field] = val;
    });
    return obj;
  });
}

const STRATEGY_OPTIONS = [
  { value: "skip", label: "Skip duplicates", desc: "Existing records are left unchanged." },
  { value: "overwrite", label: "Overwrite existing", desc: "Existing records are replaced with imported data." },
  { value: "merge", label: "Merge", desc: "Only fill fields that are currently empty." },
] as const;

export function ImportDiaryModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("instructions");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, ThaField>>({});
  const [strategy, setStrategy] = useState<"skip" | "overwrite" | "merge">("skip");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const reset = () => {
    setStep("instructions");
    setParsed(null);
    setColumnMap({});
    setStrategy("skip");
    setValidationResult(null);
    setImportResult(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
      setFileError("Only .csv and .txt files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = parseFile(text);
        if (data.headers.length === 0 || data.rows.length === 0) {
          setFileError("The file appears to be empty or has no data rows.");
          return;
        }
        setParsed(data);
        setColumnMap(autoMap(data.headers));
        setStep("preview");
      } catch {
        setFileError("Failed to parse the file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const previewMutation = useMutation({
    mutationFn: (rows: Record<string, unknown>[]) =>
      apiRequest("POST", "/api/food-diary/import/preview", { rows }),
    onSuccess: async (res) => {
      const data: ValidationResult = await res.json();
      setValidationResult(data);
      setStep("validation");
    },
    onError: () => toast({ title: "Validation failed", variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ rows, strategy }: { rows: Record<string, unknown>[]; strategy: string }) =>
      apiRequest("POST", "/api/food-diary/import/confirm", { rows, strategy }),
    onSuccess: async (res) => {
      const data: ImportResult = await res.json();
      setImportResult(data);
      setStep("result");
      qc.invalidateQueries({ queryKey: ["/api/food-diary"] });
      qc.invalidateQueries({ queryKey: ["/api/food-diary/metrics/trends"] });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const handleValidate = () => {
    if (!parsed) return;
    const rows = buildMappedRows(parsed.headers, parsed.rows, columnMap);
    previewMutation.mutate(rows);
  };

  const handleImport = () => {
    if (!validationResult) return;
    confirmMutation.mutate({ rows: validationResult.validRows, strategy });
  };

  const delimiterLabel = parsed
    ? parsed.delimiter === "\t" ? "Tab" : parsed.delimiter === "|" ? "Pipe" : "Comma"
    : "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" data-testid="modal-import-diary">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Import Diary Data
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-1 pb-1">
          {(["instructions", "upload", "preview", "strategy", "validation", "result"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ["instructions", "upload", "preview", "strategy", "validation", "result"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* Step 1: Instructions */}
          {step === "instructions" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Import your wellbeing history from a CSV or TXT file.</p>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Supported file types:</p>
                      <ul className="text-muted-foreground list-disc list-inside space-y-0.5">
                        <li>.csv (comma-separated)</li>
                        <li>.txt (comma, tab, or pipe-separated — auto-detected)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Supported columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {["date", "weightKg", "sleepHours", "moodApples", "energyApples", "notes", "stuckToPlan", "calories", "mealSlot", "entryName"].map((f) => (
                          <Badge key={f} variant="secondary" className="text-[10px] font-mono">{f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">How it works:</p>
                      <ol className="text-muted-foreground list-decimal list-inside space-y-0.5">
                        <li>Upload your file</li>
                        <li>Map your file's columns to THA fields</li>
                        <li>Choose an import strategy</li>
                        <li>Review validation results</li>
                        <li>Confirm import</li>
                      </ol>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Example: <span className="font-mono">date,weightKg,sleepHours,moodApples,energyApples,notes</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === "upload" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Upload a .csv or .txt file to get started.</p>
              <label
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                data-testid="dropzone-upload"
              >
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">.csv or .txt supported</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-file-upload"
                />
              </label>
              {fileError && (
                <p className="text-sm text-destructive flex items-center gap-1" data-testid="text-file-error">
                  <AlertCircle className="h-3.5 w-3.5" />{fileError}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Preview & Column Mapping */}
          {step === "preview" && parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Delimiter detected: <strong>{delimiterLabel}</strong></span>
                <span>{parsed.rows.length} data row{parsed.rows.length !== 1 ? "s" : ""} found</span>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-sm font-medium mb-2">Map your columns to THA fields:</p>
                <div className="space-y-2">
                  {parsed.headers.map((header) => (
                    <div key={header} className="flex items-center gap-3">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded w-36 truncate shrink-0" title={header}>
                        {header}
                      </span>
                      <span className="text-muted-foreground text-xs shrink-0">→</span>
                      <Select
                        value={columnMap[header] ?? "(ignore)"}
                        onValueChange={(v) => setColumnMap((m) => ({ ...m, [header]: v as ThaField }))}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1" data-testid={`select-map-${header}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THA_FIELDS.map((f) => (
                            <SelectItem key={f.value} value={f.value} className="text-xs">
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {parsed.headers.map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} className="border-t border-border">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 text-foreground">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Strategy */}
          {step === "strategy" && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Choose how to handle duplicate entries:</p>
              <div className="space-y-2">
                {STRATEGY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      strategy === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                    }`}
                    data-testid={`radio-strategy-${opt.value}`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value={opt.value}
                      checked={strategy === opt.value}
                      onChange={() => setStrategy(opt.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Validation */}
          {step === "validation" && validationResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{validationResult.validRows.length} valid</p>
                    <p className="text-xs text-muted-foreground">Ready to import</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{validationResult.invalidRows.length} invalid</p>
                    <p className="text-xs text-muted-foreground">Will be skipped</p>
                  </div>
                </div>
              </div>
              {validationResult.invalidRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invalid rows:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {validationResult.invalidRows.map((item, i) => (
                      <div key={i} className="text-xs p-2 rounded border border-destructive/30 bg-destructive/5" data-testid={`invalid-row-${i}`}>
                        <p className="font-medium text-destructive">{item.errors.join("; ")}</p>
                        <p className="text-muted-foreground mt-0.5 font-mono truncate">
                          {Object.entries(item.row).map(([k, v]) => `${k}=${v}`).join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Result */}
          {step === "result" && importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" data-testid="icon-import-success" />
              </div>
              <p className="text-center text-sm font-medium">Import complete!</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Imported", value: importResult.imported, color: "text-green-600" },
                  { label: "Skipped", value: importResult.skipped, color: "text-muted-foreground" },
                  { label: "Failed", value: importResult.failed, color: "text-destructive" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-lg border border-border bg-muted/30" data-testid={`stat-${stat.label.toLowerCase()}`}>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer navigation */}
        <DialogFooter className="flex-shrink-0 pt-2 border-t border-border">
          {step === "instructions" && (
            <Button onClick={() => setStep("upload")} data-testid="button-next-instructions">
              Continue
            </Button>
          )}

          {step === "upload" && (
            <Button variant="outline" onClick={() => setStep("instructions")} data-testid="button-back-upload">
              Back
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")} data-testid="button-back-preview">
                Back
              </Button>
              <Button onClick={() => setStep("strategy")} data-testid="button-next-preview">
                Next: Import Strategy
              </Button>
            </>
          )}

          {step === "strategy" && (
            <>
              <Button variant="outline" onClick={() => setStep("preview")} data-testid="button-back-strategy">
                Back
              </Button>
              <Button
                onClick={handleValidate}
                disabled={previewMutation.isPending}
                data-testid="button-validate"
              >
                {previewMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Validate Rows
              </Button>
            </>
          )}

          {step === "validation" && validationResult && (
            <>
              <Button variant="outline" onClick={() => setStep("strategy")} data-testid="button-back-validation">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={confirmMutation.isPending || validationResult.validRows.length === 0}
                data-testid="button-confirm-import"
              >
                {confirmMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Import {validationResult.validRows.length} valid row{validationResult.validRows.length !== 1 ? "s" : ""}
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={() => handleClose(false)} data-testid="button-close-result">
              Done
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
