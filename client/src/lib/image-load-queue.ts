// PLANNERPERF4 — a shared, app-wide concurrency limit for external recipe/product
// image loads. A week of meals or a cookbook grid can mount a dozen-plus thumbnails
// at once; letting every one of them hit the network simultaneously means they all
// compete for bandwidth and connections to a handful of third-party hosts we don't
// control, so the first ones a household actually looks at arrive no faster than
// the rest. This makes every <ThrottledMealImage> share one queue: at most
// MAX_CONCURRENT images are ever in flight app-wide, and the rest wait their turn
// in the order they were requested. The Service Worker (sw.js) still caches the
// bytes once fetched; this only governs how many fetches run at the same time.
const MAX_CONCURRENT = 2;

let active = 0;
const queue: Array<() => void> = [];
const inFlight = new Map<string, Promise<void>>();

function runNext() {
  if (active >= MAX_CONCURRENT) return;
  const next = queue.shift();
  if (!next) return;
  active++;
  next();
}

/** Resolves once `url` has been loaded by the browser (success or failure), honouring the shared concurrency cap. Safe to call more than once for the same url — later callers share the same in-flight load. */
export function loadImageThrottled(url: string): Promise<void> {
  if (!url) return Promise.resolve();
  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    queue.push(() => {
      const img = new Image();
      const finish = () => {
        active--;
        resolve();
        runNext();
      };
      img.onload = finish;
      img.onerror = finish;
      img.src = url;
    });
    runNext();
  });
  inFlight.set(url, promise);
  return promise;
}
