import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      // 2026-11-02 (owner) — "view my dev website on my phone, same wifi
      // network": 127.0.0.1 only accepts connections from this machine
      // itself. 0.0.0.0 binds every network interface, so a phone on the
      // same LAN can reach it at this PC's own LAN IP (e.g.
      // http://192.168.4.111:5001) instead of only localhost.
      host: "0.0.0.0",
      port: 5001,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
        },
        "/uploads": {
          target: "http://localhost:5000",
        },
      },
    },
  }),
);
