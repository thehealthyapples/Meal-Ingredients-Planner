# INT19 — Input Platform Design (Voice-first)

**Status:** INVESTIGATION ONLY — no code, schema, route, UI, or capability changes.
**Classification:** Intelligence design investigation.
**Date:** 2026-06-30
**Branch:** `int1-intelligence-platform`
**HEAD at start:** `8380b1c`
**Author:** Architecture investigation (Claude Code)

**Governing documents (mandatory reading before implementation):**
- `docs/architecture/README.md` — architecture bootstrap (read first)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1) — the platform spine
- `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2) — registry + confirmation tiers
- `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) — Part 5 (Voice), Part 2 (entry points)
- `docs/investigations/INT18_CONVERSATION_PLATFORM_DESIGN.md` — Conversation Gateway (the platform INT19 feeds into)
- `docs/architecture/ENGINEERING_WORKFLOW.md` — compliance checklist

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Branch `int1-intelligence-platform`, HEAD `8380b1c` |
| HEAD commit | `8380b1c` — `Update project documentation and add new test scripts` |
| **Rollback tag** | **`int19-rollback-pre-input-platform-design`** *(create before any implementation)* |
| Code modified | None — this document is the only artifact |
| Schema modified | None |
| Routes modified | None |

**This is an investigation only.** No application code, schema, services, routes, prompts, or capability bindings were modified or created. The single output is this document.

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

Per the standing mandate: *if any proposal conflicts with governing architecture — STOP, explain, do not continue.*

| Principle / check | INT19 compliance | Verdict |
|---|---|---|
| **One canonical assistant** | The Input Platform is an *adapter layer*. It normalises input from any modality into an utterance + surface hints and hands off to the Conversation Gateway (INT18). It introduces no assistant logic of its own. | ✅ Pass |
| **One Intelligence Platform** | All input, regardless of modality, feeds the single `intelligencePlatform` singleton via the INT18 Conversation Gateway. No second platform, no modality-specific brain. | ✅ Pass |
| **One Capability Registry** | The Input Platform normalises *how* something is said; the registry governs *what* can be done. An input adapter cannot bypass the registry. | ✅ Pass |
| **One Intent Engine** | Every resolved action routes through `intelligencePlatform.handle()`. A voice utterance reaches the same `route()` pipeline as a typed command. | ✅ Pass |
| **No duplicate business logic** | Input adapters hold zero domain logic. They produce an utterance; the Conversation Gateway and Intent Engine interpret it. | ✅ Pass |
| **No duplicate state** | The Input Platform holds transient capture state (microphone stream, recording buffer, interim transcript) only. It records nothing. The Conversation Gateway (INT18) owns the conversation store. | ✅ Pass |
| **Extend existing architecture** | Centralises the three existing isolated WebSpeech implementations (`list-page.tsx`, `meals-page.tsx` × 2) and the four existing scan components into a shared platform. Replaces nothing at the business layer. | ✅ Pass |
| **Progressive enrichment** | Voice and scan are *additional input paths*; the text path (INT18) is always available as fallback. Input Platform degrades gracefully where APIs are unavailable. | ✅ Pass |
| **Honest gaps over fabrication** | The Input Platform produces transcripts — it does not interpret intent or fabricate capability responses. Interpretation remains at the Conversation Gateway and Intent Engine. | ✅ Pass |

**Gate result: PASS.** The Input Platform is an edge adapter layer. It sits *in front of* the Conversation Gateway, translating human signals into utterances. It adds no intelligence, no conversation state, and no business logic. The investigation continues.

---

## 1. WHAT "INPUT PLATFORM" MEANS — SCOPE

The Input Platform is the **adapter layer between any human input modality and the INT18 Conversation Gateway.**

Its contract is simple and fixed:

```
Human signal  →  [Input Adapter]  →  InputEvent  →  Conversation Gateway (INT18)
                                                              ↓
Response text  ←  [Output Adapter]  ←  AssistantResponse  ←
```

**Every input adapter must produce one `InputEvent`:**

```typescript
interface InputEvent {
  utterance:     string;          // normalised text — the single canonical form
  surface:       Surface;         // which persona/context this came from
  surfaceHints:  SurfaceHints;    // what's currently on screen
  inputModality: InputModality;   // how it arrived
}

type InputModality = 'text' | 'voice' | 'quick-action' | 'scan-image' | 'barcode';
```

**Every output adapter must consume one `AssistantResponse`** (from INT18) and render it appropriately for its modality:
- Text → renders in `ConversationThread` (INT18 UI)
- Voice → speaks via TTS, observing the TIP2 confirmation tier
- Quick action → updates chip state

**What INT19 designs:**

| Modality | Adapter | Status |
|---|---|---|
| Text | `AssistantInput` (already in INT18 design) | INT18 scope |
| **Voice** | `VoiceInputAdapter` + `VoiceOutputAdapter` | **INT19 primary focus** |
| Quick actions | `QuickActionAdapter` (already in INT18 design) | INT18 scope |
| Image / scan | `ScanInputAdapter` (connects existing scan components) | INT19 secondary |
| Barcode | `BarcodeInputAdapter` (connects existing scanner) | INT19 secondary |

"Voice-first" means voice is the **design lead** — the platform is designed so that every feature that works by text also works by voice, without additional engineering at the capability layer. Voice is not bolted on; it is the reference modality that validates the adapter contract.

---

## 2. GROUNDING — WHAT EXISTS TODAY

### 2.1 Voice: three isolated, unshared implementations

WebSpeech API is already used in production, but as **page-scoped one-offs**:

| File | Implementation | Issues |
|---|---|---|
| `client/src/pages/list-page.tsx` (line ~84) | `window.SpeechRecognition` / `webkitSpeechRecognition`, interim results, adds spoken text to shopping list | Isolated; no error recovery; not connected to Conversation Gateway; not reusable |
| `client/src/pages/meals-page.tsx` (line ~5412) | Same API, `continuous: true`, `interimResults: true`, `lang: "en-GB"`, transcript state | Isolated; duplicated logic; not reusable |
| `client/src/pages/meals-page.tsx` (line ~5884) | Second implementation in the same file, different meal search context | Two impls in one file; no coordination |

**Key finding:** The WebSpeech API is proven and working. Three independent, functional implementations already exist. INT19 centralises them into one shared hook/adapter — no new browser API is introduced.

### 2.2 Scan: four components, no connection to the Intelligence Platform

| Component | What it does | Gap |
|---|---|---|
| `BarcodeScanner.tsx` | ZXing + native `BarcodeDetector`, EAN-13/UPC-A/UPC-E, rear camera | Passes barcode string to a page-scoped `onScan` callback; not connected to Intelligence Platform |
| `PlannerScanReview.tsx` | Image → OCR → regex parser → optional GPT-4o-mini | Page-scoped; result goes to the planner directly; not through the Conversation Gateway |
| `RecipeScanReview.tsx` | Same OCR pipeline, recipe context | Page-scoped; not through Conversation Gateway |
| `ShoppingListScanReview.tsx` | Same OCR pipeline, shopping context | Page-scoped; not through Conversation Gateway |
| `POST /api/scan` | Server-side scan route | Exists; used by the above components |

**Key finding:** Scan infrastructure is mature. The gap is not the scan capability — it is routing scan results through the Conversation Gateway and recording them as conversation turns.

### 2.3 Text-to-speech: not yet implemented

`window.speechSynthesis` exists in all target browsers (Chrome, Safari, Edge, Firefox). It has **never been used in THA**. No TTS implementation exists anywhere in the codebase.

### 2.4 OpenAI SDK: already in the stack

`openai ^6.27.0` is in `package.json`. The `audio.transcriptions.create` endpoint (Whisper) is available at zero additional SDK cost. It is not yet used for STT — only for food classification and enrichment. This is the server-side transcription fallback.

### 2.5 Browser support for the required APIs

| API | Chrome | Safari | Firefox | Edge | Coverage |
|---|---|---|---|---|---|
| `SpeechRecognition` | 25+ ✅ | 14.1+ ✅ | ❌ (no support) | 79+ ✅ | ~90% mobile, ~80% desktop |
| `speechSynthesis` | 33+ ✅ | 7+ ✅ | 49+ ✅ | 14+ ✅ | ~98% |
| `BarcodeDetector` | 83+ ✅ | ❌ | ❌ | 83+ ✅ | ~65% (ZXing fallback for rest) |
| `getUserMedia` | ✅ | ✅ | ✅ | ✅ | ~99% |
| `MediaRecorder` | ✅ | 14.1+ ✅ | ✅ | ✅ | ~95% |

**Strategy:** Use `SpeechRecognition` (WebSpeech) as the primary STT path — already proven in three pages. Offer Whisper (server-side) as a quality fallback for unsupported browsers and for cooking mode, where accuracy matters more. Use `speechSynthesis` for TTS — broad support, zero cost. ZXing is already the `BarcodeDetector` fallback.

---

## 3. THE ADAPTER CONTRACT

The Input Platform exposes two contracts: one per modality for input, one for output.

### 3.1 Input adapter contract

```typescript
/**
 * Every input adapter must implement this interface.
 * The adapter's only job is to turn a human signal into an InputEvent.
 * It holds no conversation state, no capability knowledge, no domain logic.
 */
interface InputAdapter {
  readonly modality: InputModality;

  /** True if this adapter can operate in the current browser / environment. */
  isSupported(): boolean;

  /**
   * Produce an InputEvent from a human signal.
   * Called by the FloatingAssistant (INT18) or the surface it is embedded in.
   * Returns null if the adapter could not capture input (user cancelled, no audio, etc.)
   */
  capture(context: AdapterContext): Promise<InputEvent | null>;

  /** Optional: clean up (stop microphone, release camera). Called on unmount. */
  dispose?(): void;
}

interface AdapterContext {
  surface:      Surface;
  surfaceHints: SurfaceHints;
}
```

### 3.2 Output adapter contract

```typescript
/**
 * Every output adapter must implement this interface.
 * Consumes an AssistantResponse and renders it for its modality.
 */
interface OutputAdapter {
  readonly modality: OutputModality;

  /** Render the assistant response for this modality. */
  render(response: AssistantResponse, confirmationTier: ConfirmationTier): Promise<void>;

  /** Interrupt the current output (e.g. user speaks over TTS — barge-in). */
  interrupt?(): void;
}

type OutputModality = 'text' | 'voice';
```

### 3.3 Platform registry

```typescript
/**
 * The Input Platform — a lightweight registry of adapters.
 * Not a business service; not an intelligence engine.
 * The sole purpose is adapter discovery and dispatch.
 */
class InputPlatform {
  register(adapter: InputAdapter): void;
  registerOutput(adapter: OutputAdapter): void;
  bestInputAdapter(modality?: InputModality): InputAdapter | null;
  outputAdapter(modality: OutputModality): OutputAdapter | null;
}

/** Singleton — one input platform per app. */
export const inputPlatform = new InputPlatform();
```

---

## 4. VOICE INPUT ADAPTER

### 4.1 `useVoiceInput` — centralised hook

Replaces the three isolated implementations in `list-page.tsx` and `meals-page.tsx`. Exposes a single, reusable interface.

```typescript
interface VoiceInputState {
  isListening:       boolean;
  interimTranscript: string;   // live, changes as the user speaks
  finalTranscript:   string;   // committed once recognition ends
  error:             VoiceInputError | null;
  isSupported:       boolean;
}

interface VoiceInputControls {
  start():  void;
  stop():   void;
  reset():  void;
}

function useVoiceInput(options?: VoiceInputOptions): [VoiceInputState, VoiceInputControls]

interface VoiceInputOptions {
  lang?:             string;    // default 'en-GB'
  continuous?:       boolean;   // default false (push-to-talk); true for cooking mode
  interimResults?:   boolean;   // default true (show live transcript)
  onFinalTranscript?: (text: string) => void;
}
```

**Implementation:** `window.SpeechRecognition || window.webkitSpeechRecognition`. Identical to the existing three implementations — centralised.

**Degradation:** If `isSupported === false`, the hook returns an inert state. The `VoiceTrigger` button hides itself (no microphone icon shown if the API is unavailable). The text input path (INT18) is always available.

### 4.2 `VoiceInputAdapter` — the platform adapter

```typescript
class VoiceInputAdapter implements InputAdapter {
  readonly modality = 'voice';
  isSupported(): boolean { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  async capture(ctx: AdapterContext): Promise<InputEvent | null>;
}
```

### 4.3 `VoiceTrigger` — the UI component

```
VoiceTrigger
 ├─ Microphone button (hidden if !isSupported)
 ├─ InterimTranscript overlay (live text while listening)
 ├─ ListeningIndicator (pulsing ring while active)
 └─ ErrorBanner (if permission denied or no speech detected)
```

**Push-to-talk (default):** hold the mic button to speak; release to submit. Produces a single `InputEvent` on release.

**Tap-to-listen (cooking mode):** tap once to start continuous listening; tap again (or say "stop") to end.

### 4.4 Permission handling

`getUserMedia` and `SpeechRecognition` both require explicit browser permission. The `VoiceTrigger` handles the permission lifecycle:

1. **First use:** browser prompts for microphone permission. If denied, `VoiceTrigger` shows a "Microphone access needed" inline message and falls back to text silently.
2. **Subsequent use:** permission is remembered by the browser. No re-prompt.
3. **Safari:** Safari requires a user gesture to start `SpeechRecognition`. `VoiceTrigger` wraps `start()` in the tap/hold handler — compliant by construction.

---

## 5. VOICE OUTPUT ADAPTER (TTS)

### 5.1 TIP2 confirmation tier → TTS behaviour

TIP3 Part 5 §6.2 specifies that confirmation tiers are **read back in full on voice** because there is no screen. The `VoiceOutputAdapter` implements this:

| TIP2 Tier | What the output adapter does |
|---|---|
| `none` | Speaks the response text at normal pace. No confirmation. |
| `light` | Speaks a brief echo of what is about to happen + "Okay?" (waits for spoken "yes" / "no"). |
| `required` | Reads the full resolved entities aloud ("Move **Chicken Curry** from Wednesday to **Friday** this week — shall I?"). Waits for explicit assent. |
| `strong` | Reads the irreversibility warning + itemised scope. Requires "confirm [action]" — not just "yes". Timeout = not confirmed. |

### 5.2 `useVoiceOutput` hook

```typescript
interface VoiceOutputState {
  isSpeaking:  boolean;
  isPaused:    boolean;
  isSupported: boolean;
}

interface VoiceOutputControls {
  speak(text: string, options?: SpeakOptions): void;
  pause():     void;
  resume():    void;
  cancel():    void;  // barge-in calls this
}

interface SpeakOptions {
  rate?:    number;  // 0.5–2.0; default 1.0; adjustable by user
  pitch?:   number;  // 0.5–2.0; default 1.0
  voice?:   string;  // SpeechSynthesis voice name; default system voice
  lang?:    string;  // default 'en-GB'
}
```

**Implementation:** `window.speechSynthesis`. `SpeechSynthesisUtterance` takes the response text; `speechSynthesis.speak()` queues it.

### 5.3 Barge-in

When the user begins speaking during TTS playback, the `VoiceOutputAdapter` calls `speechSynthesis.cancel()` immediately. The `VoiceTrigger` detects speech start via the `SpeechRecognition` API's `onstart` event and triggers the interrupt.

**TIP3 §6.3 rule:** a confirmation interrupted by barge-in is treated as *not confirmed* — the pending intent is cancelled. The system never interprets "speaking over a confirmation" as "yes".

### 5.4 Confidence-calibrated speech

The `AssistantResponse` carries a `confidence` signal from the Conversation Gateway. The `VoiceOutputAdapter` uses language softeners that match:

| Confidence | Spoken prefix |
|---|---|
| High (sourced, grounded) | *(no prefix)* — "Your planner has…" |
| Medium (advisory) | "Based on what I can see…" |
| Low (gap/honest) | "I'm not certain, but…" / "I don't have information on that yet." |

This is the TIP3 Part 11 honest-gaps principle expressed as a TTS behaviour.

---

## 6. SERVER-SIDE TRANSCRIPTION (WHISPER FALLBACK)

### 6.1 When to use Whisper instead of WebSpeech

| Condition | Use WebSpeech | Use Whisper |
|---|---|---|
| Browser supports `SpeechRecognition` | ✅ Default | |
| Browser does not support `SpeechRecognition` (Firefox, old browsers) | | ✅ Fallback |
| Cooking mode (accuracy critical, noisy environment) | | ✅ Better accuracy |
| Long-form dictation (recipe description, diary note) | | ✅ Better for length |
| User has set "prefer high-accuracy transcription" in settings | | ✅ Explicit |

### 6.2 Whisper route

```
POST /api/intelligence/conversation/transcribe
Content-Type: multipart/form-data
Body: { audio: Blob (wav/webm/mp4), lang: "en-GB" }
Response: { transcript: string, duration_ms: number }
```

**Implementation:** `openai.audio.transcriptions.create({ file, model: "whisper-1", language: "en" })`. The OpenAI SDK (`openai ^6.27.0`) already in the stack; no new dependency.

**Audio capture:** `MediaRecorder` (supported ~95%) captures the audio blob. When the user stops recording, the blob is sent to this route.

**Auth:** requires authenticated session. Same as all `/api/intelligence/*` routes.

**Cost note:** Whisper is priced per audio minute (~$0.006/min). Push-to-talk utterances are typically 2–10 seconds. Cost per utterance: ~$0.001. Acceptable for occasional fallback use; not for every turn at scale. Cooking mode (where Whisper is preferred) is a deliberate user-initiated mode, not a passive background listener.

### 6.3 `WhisperInputAdapter`

```typescript
class WhisperInputAdapter implements InputAdapter {
  readonly modality = 'voice';
  isSupported(): boolean { return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder); }
  async capture(ctx: AdapterContext): Promise<InputEvent | null>;
  // Records via MediaRecorder, POSTs to /api/intelligence/conversation/transcribe,
  // returns InputEvent with transcript.
}
```

The `InputPlatform` selects `WhisperInputAdapter` when `WebSpeechInputAdapter.isSupported() === false`, or when the user requests high-accuracy mode.

---

## 7. HANDS-FREE COOKING MODE

### 7.1 What cooking mode is

A dedicated voice profile for use while cooking — phone propped up, hands occupied. Designed around TIP3 Part 5 §6.4:

- **Continuous listening** — wake-word or single tap to start; stays active until user stops it
- **Context-locked** — the Context Frame is pinned to the meal being cooked (surfaceHints.selectedMealId fixed for the session)
- **Read-mostly** — write intents are minimised; strong-confirmed when attempted
- **Step navigation** — "next", "repeat", "how much?", "back" map to recipe navigation intents
- **Ambient-tolerant** — confidence threshold raised; uncertain transcripts trigger clarification, not execution

### 7.2 Cooking mode state machine

```
IDLE
 └──(tap "Start cooking")──→ LISTENING (continuous)
                                   ├─ (utterance detected) ──→ PROCESSING
                                   │      └─ (response ready) ──→ SPEAKING ──→ LISTENING
                                   ├─ (silence > 30s) ──→ IDLE (auto-pause)
                                   └─ (tap "Stop") ──→ IDLE
```

**Barge-in in cooking mode:** if the user speaks while the assistant is speaking, `speechSynthesis.cancel()` fires immediately and recognition restarts. No partial confirmation is treated as yes.

### 7.3 Cooking mode intents

| Spoken | Resolved as | Notes |
|---|---|---|
| "Next step" / "Next" | `Read × Meals` (step navigation) | Read-only; no confirmation |
| "Repeat" | Re-speaks current step | Read-only |
| "How much [ingredient]?" | `Read × Meals` (ingredient lookup) | Read-only |
| "What temperature?" | `Read × Meals` | Read-only |
| "Add [item] to my list" | `Add × Shopping` | **Light confirm** read aloud |
| "Set timer for 20 minutes" | honest gap (timer = TIP2 gap) | "I can't set a timer yet — use your phone's timer" |
| "Clear this week" | `Delete × Planner` | **Strong confirm**, full read-back, requires "confirm clear" |

### 7.4 Cooking mode UI

```
CookingModeBar (full-width banner, appears when mode active)
 ├─ MealName + step indicator ("Spaghetti Bolognese — Step 3 of 8")
 ├─ ListeningIndicator (pulsing)
 ├─ CurrentStep text (large, readable from counter distance)
 └─ StopCookingButton
```

The standard `FloatingAssistant` (INT18) is hidden during cooking mode — the `CookingModeBar` replaces it for the session.

---

## 8. SCAN ADAPTERS — CONNECTING EXISTING INFRASTRUCTURE

### 8.1 Current gap

The four existing scan components produce results that go **directly to their parent page** (planner, recipe library, shopping list). They bypass the Conversation Gateway and are therefore:
- Not recorded as conversation turns
- Not contextually linked to prior conversation
- Not accessible via follow-up ("what did I just scan?")

### 8.2 `ScanInputAdapter`

Wraps the existing OCR pipeline (`POST /api/scan`) and produces an `InputEvent`:

```typescript
class ScanInputAdapter implements InputAdapter {
  readonly modality = 'scan-image';
  isSupported(): boolean { return !!(navigator.mediaDevices?.getUserMedia); }
  async capture(ctx: AdapterContext): Promise<InputEvent | null>;
  // Opens camera modal → captures image → POSTs to /api/scan
  // Returns InputEvent with utterance = "I scanned: [extracted text]"
  // and surfaceHints.scanResult = the raw OCR output
}
```

**The existing `PlannerScanReview`, `RecipeScanReview`, `ShoppingListScanReview` are NOT replaced.** They continue to work as they do today. The `ScanInputAdapter` is an *additional path* — when triggered from the `FloatingAssistant`, the scan result routes through the Conversation Gateway first, which can then dispatch to the appropriate handler. The existing direct-to-page paths remain for their current UX contexts.

### 8.3 `BarcodeInputAdapter`

Wraps the existing `BarcodeScanner.tsx` (ZXing + native `BarcodeDetector`):

```typescript
class BarcodeInputAdapter implements InputAdapter {
  readonly modality = 'barcode';
  isSupported(): boolean { return !!(navigator.mediaDevices?.getUserMedia); }
  async capture(ctx: AdapterContext): Promise<InputEvent | null>;
  // Opens BarcodeScanner → on scan: produces InputEvent with
  // utterance = "I scanned barcode: [code]"
  // surfaceHints.barcodeValue = the raw barcode string
}
```

The existing `BarcodeScanner.tsx` component is **reused unchanged** — the adapter wraps it, not replaces it.

---

## 9. FILE STRUCTURE

All new files under `client/src/lib/input-platform/` and `server/intelligence/input/`:

```
client/src/lib/input-platform/
  index.ts                       — barrel export
  types.ts                       — InputEvent, InputAdapter, OutputAdapter, InputModality
  platform.ts                    — InputPlatform class + inputPlatform singleton
  adapters/
    voice-webspeech.ts           — WebSpeechInputAdapter + useVoiceInput hook
    voice-whisper.ts             — WhisperInputAdapter (MediaRecorder → server transcription)
    voice-output.ts              — VoiceOutputAdapter + useVoiceOutput hook
    scan-image.ts                — ScanInputAdapter
    barcode.ts                   — BarcodeInputAdapter
    quick-action.ts              — QuickActionAdapter (pre-filled intents, INT18)

client/src/components/intelligence/
  VoiceTrigger.tsx               — mic button, push-to-talk / tap-to-listen
  CookingModeBar.tsx             — full-width cooking mode banner
  InterimTranscriptOverlay.tsx   — live transcript display while listening

server/intelligence/input/
  transcribe-route.ts            — POST /api/intelligence/conversation/transcribe (Whisper)
```

**Refactor targets (existing isolated implementations — replaced in Phase 0):**

| File | Current voice implementation | Action |
|---|---|---|
| `client/src/pages/list-page.tsx` lines ~84–202 | Inline `SpeechRecognition` for shopping list voice input | Replace with `useVoiceInput` hook |
| `client/src/pages/meals-page.tsx` lines ~5412–5456 | First inline `SpeechRecognition` | Replace with `useVoiceInput` hook |
| `client/src/pages/meals-page.tsx` lines ~5884–6206 | Second inline `SpeechRecognition` | Replace with `useVoiceInput` hook |

The replacements are **functional equivalents**, not capability changes. Each isolated implementation already uses the same API; the centralised hook uses the same API with the same options.

---

## 10. PHASING

### Phase 0 — Centralise WebSpeech (no new capability)

**Scope:**
- `client/src/lib/input-platform/` directory: `types.ts`, `platform.ts`, `adapters/voice-webspeech.ts`
- `useVoiceInput` hook
- `VoiceTrigger` component (basic — mic button only)
- Replace three isolated implementations in `list-page.tsx` and `meals-page.tsx` with the hook
- **No connection to Conversation Gateway yet** — existing page-scoped callbacks remain; the hook just normalises the code

**Why:** reduces three slightly-different WebSpeech implementations to one. Zero capability change, lower maintenance surface. Required before Phase 1 can add the Gateway connection.

**Definition of done:**
- `useVoiceInput` passes unit tests for: start/stop/reset, interim transcript updates, error states, unsupported browser returns `isSupported: false`
- `list-page.tsx` and `meals-page.tsx` voice features work identically to before, using the hook
- No new API routes

### Phase 1 — Connect voice to the Conversation Gateway

**Scope:**
- `FloatingAssistant` (INT18) gains a `VoiceTrigger` — speak → `InputEvent` → Conversation Gateway → response
- `VoiceOutputAdapter` + `useVoiceOutput` — response text is spoken via `speechSynthesis`
- TIP2 confirmation tiers applied to TTS output (read back per tier)
- Barge-in (interrupt `speechSynthesis` on new speech start)
- `adapters/voice-output.ts`

**Capability at end of Phase 1:**
> The user can tap the mic in the floating assistant, speak a question ("What's in my planner this week?"), and hear a grounded response spoken back. Confirmed writes are echoed aloud. Barge-in stops playback. Honest gaps are spoken plainly.

**Definition of done:**
- Voice turn recorded as a conversation turn with `inputModality: 'voice'`
- TTS reads the response
- `light` / `required` / `strong` tiers produce the correct read-back format
- Barge-in cancels TTS and does not treat interrupted confirmation as "yes"

### Phase 2 — Hands-free cooking mode

**Scope:**
- `CookingModeBar` component
- `CookingModeProfile` — continuous listening, context-locked, read-mostly
- Step navigation intents (`Read × Meals` step-nav verbs — requires a new `Meals` binding verb)
- Wake-word or tap-to-toggle; auto-pause on silence

**Gate:** requires that `Meals` read binding (INT15) supports step-navigation verbs, or that step navigation is added as a new executable intent. A separate capability review before implementation.

### Phase 3 — Whisper server-side transcription

**Scope:**
- `POST /api/intelligence/conversation/transcribe` route
- `WhisperInputAdapter`
- `MediaRecorder`-based audio capture
- Automatic fallback for Firefox and browsers without `SpeechRecognition`

**No schema change.** Whisper just returns a transcript string; the conversation turn is recorded identically to a WebSpeech turn.

### Phase 4 — Scan adapters connect to Conversation Gateway

**Scope:**
- `ScanInputAdapter` and `BarcodeInputAdapter`
- Scan result → `InputEvent` → Conversation Gateway → turn recorded
- "What did I scan?" follow-up resolves via entity refs
- Existing direct-to-page scan flows are **preserved** (not removed)

---

## 11. WHAT DOES NOT CHANGE

| Component | Status |
|---|---|
| `BarcodeScanner.tsx` | Unchanged. `BarcodeInputAdapter` wraps it. |
| `PlannerScanReview.tsx` | Unchanged. Direct-to-planner path preserved. |
| `RecipeScanReview.tsx` | Unchanged. |
| `ShoppingListScanReview.tsx` | Unchanged. |
| `POST /api/scan` | Unchanged. |
| `intelligencePlatform` singleton | Unchanged. |
| All capability bindings (INT2–INT17) | Unchanged. |
| Conversation Gateway (INT18) | Unchanged interface. |
| `shared/schema.ts` | No changes. The Input Platform is stateless. |

---

## 12. RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **WebSpeech misfire in noisy environments** — the API recognises ambient speech as input and submits an unintended utterance | 🟠 High | Push-to-talk (hold to speak) is the default mode — ambient noise is only an issue while the button is held. Cooking mode uses a higher confidence threshold and always requires confirmation before any write intent executes. |
| R2 | **Barge-in treated as confirmation** — user speaks during TTS; system interprets speech start as "yes" to a pending confirmation | 🔴 Critical | `VoiceOutputAdapter.interrupt()` is called on `SpeechRecognition.onstart`. A barge-in cancels the pending confirmation and restarts listening from the beginning. Never treated as assent. |
| R3 | **Microphone permission denied** — user refuses; voice feature is silently broken | 🟡 Medium | `VoiceTrigger` handles `NotAllowedError` explicitly: shows inline guidance, degrades to text input. Never crashes or shows a blank mic button that doesn't work. |
| R4 | **Whisper transcription cost at scale** — if Whisper is used for every turn rather than just fallback, costs accumulate | 🟠 High | Whisper is the fallback / explicit opt-in path, not the default. WebSpeech is free (browser-side). Rate-limit `POST /transcribe` per user (e.g. 20 req/min). Monitor in production. |
| R5 | **iOS Safari SpeechRecognition instability** — Safari's implementation fires `onend` unexpectedly in continuous mode | 🟡 Medium | `useVoiceInput` wraps `onend` with a restart loop (if `continuous === true` and `isListening === true`, restart after `onend`). This is the known Safari workaround. |
| R6 | **Scan adapter races with existing page handlers** — opening `ScanInputAdapter` from the floating assistant while a page-scoped scan flow is already open | 🟡 Medium | `ScanInputAdapter.capture()` checks if a camera session is already active before opening a new one. Page-scoped scan flows own their camera; the adapter yields to them. |
| R7 | **Cooking mode context drift** — the pinned Context Frame (selectedMealId) becomes stale if the meal is deleted during cooking | 🟡 Medium | The context lock holds the ID but re-reads the meal on each turn. If the meal is gone, the assistant says "that meal no longer exists" and exits cooking mode gracefully. |
| R8 | **TTS verbosity alienates text users** — voice output is added to the floating assistant in a way that auto-speaks on text interactions | 🟡 Medium | TTS is only active when the last input was via voice. If the user typed a question, the assistant never auto-speaks the response. The output modality follows the input modality. |
| R9 | **Three isolated WebSpeech implementations diverge further before Phase 0** — more page-level voice features are added between now and INT19 implementation | 🟡 Medium | Document the refactor target list explicitly (§9) so any new voice feature added before Phase 0 is added via `useVoiceInput` rather than a fourth isolated implementation. |

---

## 13. OPEN QUESTIONS

| # | Question | Options | Decision point |
|---|---|---|---|
| OQ1 | **Cooking mode activation UX** — how does the user start cooking mode? | (a) Voice command "Start cooking [meal name]"; (b) Button on the meal detail page; (c) Both | Phase 2 |
| OQ2 | **Wake-word** — does cooking mode use a wake-word or continuous push-to-talk? | Wake-word (requires `annyang` or custom always-on detection — privacy implications); Tap-to-toggle (simpler, no always-on mic) | Phase 2. Recommendation: tap-to-toggle for Phase 2; wake-word as a future opt-in |
| OQ3 | **Voice language selection** — all existing impls use `en-GB`. Should the app support other languages? | (a) `en-GB` only for now; (b) inherit from user's browser locale; (c) user-selectable in profile | Profile integration question. Recommendation: inherit browser locale, `en-GB` fallback |
| OQ4 | **TTS voice selection** — which `SpeechSynthesisVoice` to use? | System default (safest); gender/region preference in profile; fixed per-brand voice | Phase 1. Recommendation: system default for Phase 1; profile preference Phase 3 |
| OQ5 | **Whisper cost control** — rate limit per user per day or per minute? | Per-minute (burst protection); per-day (budget protection); both | Phase 3. Recommendation: 20 req/min + 200 req/day per user |
| OQ6 | **Step navigation intents** — what verbs does cooking mode need from the Meals binding? | `navigate-step`, `read-ingredient`, `read-timing` — these are not in the current TIP2 verb list | Requires a TIP2 verb extension or a cooking-mode-specific intent vocabulary. Separate capability review before Phase 2. |

---

## 14. RELATIONSHIP TO INT SERIES

| Investigation | Relationship |
|---|---|
| INT18 (Conversation Platform) | INT19 feeds into INT18's Conversation Gateway. The Input Platform produces `InputEvent`; the Gateway processes it. Without INT18, INT19 Phase 1 cannot land. |
| TIP3 (experience architecture) | INT19 implements TIP3 Phase E3 (voice adapters). Hands-free cooking mode, barge-in, and TTS confirmation tiers are specified in TIP3 Part 5. |
| TIP2 (registry + confirmation tiers) | TTS output is calibrated to TIP2 confirmation tiers (`none` / `light` / `required` / `strong`). The Input Platform never executes a capability — it only normalises input. |
| TIP1 (platform) | INT19 is an adapter in front of the TIP1 Gateway. TIP1 §11 proved voice requires nothing below the Gateway to change; INT19 is the implementation of that proof. |
| INT2–INT17 (capability bindings) | Unchanged. Voice input resolves through the same bindings as text input. |

---

## 15. SAFE TO SHIP — PHASED VERDICT

| Phase | Safe to ship? | Condition |
|---|---|---|
| Phase 0 (centralise WebSpeech) | **YES** | Functional equivalents only. Three isolated implementations → one shared hook. No new capability, no schema change, no new routes. Existing tests must pass. |
| Phase 1 (voice → Gateway + TTS) | **YES, conditionally** | Requires INT18 Phase 1 (Conversation Gateway) to be live. Barge-in must not treat interruption as confirmation (R2). TTS modality follows input modality — text users never hear auto-speech. |
| Phase 2 (cooking mode) | **YES, conditionally** | Write intents in cooking mode must remain strong-confirmed. Step-navigation verbs must be reviewed against TIP2 (OQ6) before landing. |
| Phase 3 (Whisper fallback) | **YES** | Rate-limiting must be in place before landing. Whisper is a fallback, not the default. |
| Phase 4 (scan adapters → Gateway) | **YES** | Existing scan flows must remain functional and untouched. Adapter is an additional path, not a replacement. |

---

## 16. RECOMMENDATION

**Proceed with Phase 0 immediately after INT18 Phase 0.**

**Rationale:**

1. **Phase 0 costs nothing new.** Three WebSpeech implementations already exist and work. Centralising them into one hook reduces maintenance surface with zero user-visible change. This is net-positive regardless of when the Conversation Gateway lands.

2. **Voice-first validates the adapter contract.** Designing the Input Platform around voice as the reference modality means every text input, quick action, and scan input that later feeds the Conversation Gateway has an already-proven adapter contract to conform to. Voice is the hardest input to normalise; everything else is easier.

3. **Phase 1 is the real capability unlock.** When INT18 Phase 1 (Conversation Gateway) lands, Phase 1 of INT19 (voice → Gateway + TTS) can follow immediately. Together they deliver the full "speak a question, hear a grounded answer" experience that TIP3 Part E3 describes.

4. **Cooking mode is the standout differentiation.** Hands-free cooking mode is one of the most distinctive features in THA's intelligence roadmap. It is also self-contained: it adds a UI profile and a listening mode over the Phase 1 voice stack. Getting Phase 0 and Phase 1 landed early brings cooking mode into reach quickly.

5. **No schema changes in any phase.** The Input Platform is stateless at its own layer — conversation turns are persisted by INT18, not INT19. This makes every INT19 phase a forward-only addition with zero migration risk.

---

## DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| Architecture compliance gate reviewed and passed | ✅ Opening section — PASS |
| "Input Platform" scope defined and bounded | ✅ §1 |
| Grounding in existing implementations | ✅ §2 — three WebSpeech impls, four scan components, no TTS |
| Adapter contract defined (input + output) | ✅ §3 |
| Voice input adapter designed | ✅ §4 |
| Voice output adapter designed (TTS + TIP2 tiers) | ✅ §5 |
| Whisper server-side fallback designed | ✅ §6 |
| Hands-free cooking mode designed | ✅ §7 |
| Scan adapters designed | ✅ §8 |
| File structure mapped | ✅ §9 |
| Phasing with clear gates | ✅ §10 |
| What does NOT change listed explicitly | ✅ §11 |
| Risks identified | ✅ §12 (R1–R9) |
| Open questions documented | ✅ §13 (OQ1–OQ6) |
| Relationship to INT series documented | ✅ §14 |
| Safe-to-ship verdict per phase | ✅ §15 |
| Recommendation with rationale | ✅ §16 |
| Report saved to `docs/investigations/INT19_…` | ✅ this file |
| No code, schema, route, or UI created | ✅ investigation only |

---

## APPENDIX — CONSTRAINTS COMPLIANCE

✅ No code changes · ✅ No schema changes · ✅ No route changes · ✅ No new capability bindings · ✅ No refactoring · ✅ No UI created · ✅ No API calls · ✅ Investigation only.

*Investigation only. No implementation performed. Rollback tag to be created before Phase 0 implementation begins.*
