import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

performance.mark("THA_APP_START");

createRoot(document.getElementById("root")!).render(<App />);
