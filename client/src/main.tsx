import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

performance.mark("THA_APP_START");

createRoot(document.getElementById("root")!).render(<App />);

// PLANNERPERF4 — register after the page has already loaded so the Service
// Worker install never competes with first paint or the initial data fetches.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Caching recipe images is an enhancement, never a requirement — a
      // failed registration (e.g. unsupported browser, blocked by a policy)
      // must never block or degrade the app itself.
    });
  });
}
