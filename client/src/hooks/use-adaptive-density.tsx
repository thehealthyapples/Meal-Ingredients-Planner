import * as React from "react"

export type AdaptiveDensity = "compact" | "comfortable" | "expanded"

export interface AdaptiveDensityResult {
  density: AdaptiveDensity
  isCompact: boolean
  isComfortable: boolean
  isExpanded: boolean
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
  return "expanded"
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
