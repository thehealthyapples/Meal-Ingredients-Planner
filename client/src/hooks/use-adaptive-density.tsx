import * as React from "react"

// PX1-W2 (fnd-px-breakpoint-six-truths) — this file is the one owner of
// breakpoint truth. UIA §9: "two surfaces disagreeing about whether the same
// screen is small is a governance failure" — there were six definitions (five
// copy-pasted local hooks, one at 1024). MOBILE_BREAKPOINT matches Tailwind's
// `md` (768px), so JS and the `md:` classes cannot disagree about the same
// viewport. Do not re-derive this number anywhere else.
export const MOBILE_BREAKPOINT = 768

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

/** The canonical "is this a mobile viewport?" — reactive, correct on first render. */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  )
}

// UX3 — the fourth density. UIA § 9 fixes density as THE responsive model and names
// its vocabulary "compact, comfortable, expanded — the vocabulary may evolve; its
// singularity may not", so a fourth rung is admitted evolution, not a fork.
//
// It exists because the ladder used to stop at 1280: a 49-inch ultrawide and a 13-inch
// laptop resolved to the SAME density, and the only difference between them was how far
// the content stretched. That is a room getting wider rather than better, which is the
// one thing the house must never do.
//
// `spacious` spends the surplus on AIR — padding and vertical rhythm — and deliberately
// does NOT touch the type scale (see density-tokens.ts). A larger room does not get
// larger furniture; it gets better proportion around the same furniture.
export type AdaptiveDensity = "compact" | "comfortable" | "expanded" | "spacious"

// One breakpoint truth (UIA § 9): this is Tailwind's `3xl`, already declared in
// tailwind.config.ts, not a new number invented here.
export const SPACIOUS_BREAKPOINT = 1920

export interface AdaptiveDensityResult {
  density: AdaptiveDensity
  isCompact: boolean
  isComfortable: boolean
  isExpanded: boolean
  isSpacious: boolean
  isTouch: boolean
  isCoarsePointer: boolean
  orientation: "portrait" | "landscape"
  isPortrait: boolean
  isLandscape: boolean
  isUltrawide: boolean
  width: number
  height: number
}

const DEFAULT_RESULT: AdaptiveDensityResult = {
  density: "comfortable",
  isCompact: false,
  isComfortable: true,
  isExpanded: false,
  isSpacious: false,
  isTouch: false,
  isCoarsePointer: false,
  orientation: "landscape",
  isPortrait: false,
  isLandscape: true,
  isUltrawide: false,
  width: 1280,
  height: 800,
}

function deriveDensity(width: number): AdaptiveDensity {
  if (width < 640) return "compact"
  if (width < 1280) return "comfortable"
  if (width < SPACIOUS_BREAKPOINT) return "expanded"
  return "spacious"
}

function deriveDensityResult(
  width: number,
  height: number,
  isTouch: boolean,
  isCoarsePointer: boolean,
  isPortrait: boolean
): AdaptiveDensityResult {
  const density = deriveDensity(width)
  return {
    density,
    isCompact: density === "compact",
    isComfortable: density === "comfortable",
    isExpanded: density === "expanded",
    isSpacious: density === "spacious",
    isTouch,
    isCoarsePointer,
    orientation: isPortrait ? "portrait" : "landscape",
    isPortrait,
    isLandscape: !isPortrait,
    isUltrawide: width >= 1536,
    width,
    height,
  }
}

export function useAdaptiveDensity(): AdaptiveDensityResult {
  const [result, setResult] = React.useState<AdaptiveDensityResult>(DEFAULT_RESULT)

  React.useEffect(() => {
    const updateDensity = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Detect touch capability with fallback
      let isTouch = false
      try {
        const pointerMatch = window.matchMedia("(pointer: coarse)")
        isTouch = pointerMatch.matches
      } catch {
        // Fallback if matchMedia fails
        isTouch = navigator.maxTouchPoints > 0
      }

      // Detect coarse pointer
      let isCoarsePointer = false
      try {
        const coarseMatch = window.matchMedia("(pointer: coarse)")
        isCoarsePointer = coarseMatch.matches
      } catch {
        // Fallback
        isCoarsePointer = isTouch
      }

      // Detect orientation with fallback
      let isPortrait = false
      try {
        const orientationMatch = window.matchMedia("(orientation: portrait)")
        isPortrait = orientationMatch.matches
      } catch {
        // Fallback to width/height comparison
        isPortrait = height >= width
      }

      const newResult = deriveDensityResult(width, height, isTouch, isCoarsePointer, isPortrait)
      setResult(newResult)
    }

    // Initial update
    updateDensity()

    // Listen to resize
    window.addEventListener("resize", updateDensity)

    // Listen to orientation change
    try {
      window.addEventListener("orientationchange", updateDensity)
    } catch {
      // orientationchange might not be available on all browsers
    }

    // Listen to media query changes for pointer and orientation
    let pointerMatch: MediaQueryList | null = null
    let orientationMatch: MediaQueryList | null = null

    try {
      pointerMatch = window.matchMedia("(pointer: coarse)")
      pointerMatch.addEventListener("change", updateDensity)
    } catch {
      // Ignore
    }

    try {
      orientationMatch = window.matchMedia("(orientation: portrait)")
      orientationMatch.addEventListener("change", updateDensity)
    } catch {
      // Ignore
    }

    return () => {
      window.removeEventListener("resize", updateDensity)
      try {
        window.removeEventListener("orientationchange", updateDensity)
      } catch {
        // Ignore
      }
      if (pointerMatch) {
        try {
          pointerMatch.removeEventListener("change", updateDensity)
        } catch {
          // Ignore
        }
      }
      if (orientationMatch) {
        try {
          orientationMatch.removeEventListener("change", updateDensity)
        } catch {
          // Ignore
        }
      }
    }
  }, [])

  return result
}
