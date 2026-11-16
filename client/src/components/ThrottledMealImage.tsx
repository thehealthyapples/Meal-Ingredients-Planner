import { useEffect, useRef, useState } from "react";
import { loadImageThrottled } from "@/lib/image-load-queue";

interface ThrottledMealImageProps {
  src: string | null | undefined;
  alt: string;
  /** Applied to both the placeholder and the real <img>, so layout never shifts once the image is ready. */
  className: string;
  ariaHidden?: boolean;
  dataTestId?: string;
}

/**
 * PLANNERPERF4 — a meal/recipe thumbnail that only enters the shared
 * `image-load-queue` once it is actually near the viewport, and renders a
 * same-sized placeholder until its turn comes and it has loaded. Combines
 * IntersectionObserver visibility with the app-wide concurrency cap so a grid
 * of a dozen-plus thumbnails never fires more than a couple of requests at
 * once, regardless of how many are technically "visible" on a tall page.
 */
export function ThrottledMealImage({ src, alt, className, ariaHidden, dataTestId }: ThrottledMealImageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setVisible(false);
    setReady(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    if (!visible || !src) return;
    let cancelled = false;
    loadImageThrottled(src).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, src]);

  if (!src || failed) return null;

  if (!ready) {
    return <span ref={ref} className={className} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={ariaHidden}
      loading="lazy"
      decoding="async"
      className={className}
      data-testid={dataTestId}
      onError={() => setFailed(true)}
    />
  );
}
