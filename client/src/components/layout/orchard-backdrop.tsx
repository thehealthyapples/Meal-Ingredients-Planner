/**
 * The orchard environment asset — the image itself, and its one canonical owner
 * (Blueprint §6.1, adoption register `orchard-environment`).
 *
 * ARRIVAL ONLY: /auth and /onboarding (via orchard-shell.tsx) and the
 * unauthenticated landing (home-page.tsx). Blueprint §6.2 rule 3 permits arrival
 * to stand at E3; a ROOM may never mount this component — rooms receive the
 * orchard as governed exposure values, never as this image.
 *
 * ODL2: the opacity was a hardcoded 0.90 here — a raw value in a surface, which
 * UIA §16 calls a defect. It now resolves --orchard-exposure-e3, whose value IS
 * 0.90, so arrival looks exactly as it did; what changed is that the number now
 * has one home and a name.
 */
export default function OrchardBackdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <img
        src="/orchard-bg.webp"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: "var(--orchard-exposure-e3)",
        }}
      />
    </div>
  );
}
