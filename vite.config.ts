import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/assist-pipeline-card.ts",
      formats: ["es"],
      fileName: () => "hacs-assist-pipeline-card.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "hacs-assist-pipeline-card.[ext]",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
  },
});
