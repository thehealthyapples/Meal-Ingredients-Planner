import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      host: "127.0.0.1",
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
