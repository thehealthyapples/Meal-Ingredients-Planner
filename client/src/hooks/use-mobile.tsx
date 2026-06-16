import * as React from "react"
import { useAdaptiveDensity } from "./use-adaptive-density"

// Legacy: useIsMobile maintains the 768px threshold for backward compatibility.
// New code should use useAdaptiveDensity() instead, which provides a three-tier
// density model (compact/comfortable/expanded) that better handles the full
// range of device sizes. This hook remains for existing components and will
// be migrated incrementally to the new density-based system.
export function useIsMobile() {
  const density = useAdaptiveDensity()
  // Legacy threshold remains at 768px for backward compatibility
  return density.width < 768
}
