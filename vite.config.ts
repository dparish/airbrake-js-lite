/// <reference types="vitest" />
import { defineConfig } from "vite";
// @ts-ignore
export default defineConfig({
  test: {
    coverage: {
      all: true,
    },
    environment: "jsdom",
  },
  build: {
    target: "es2019",
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      output: {
        preserveModules: true,
      },
      plugins: [
      ],
    },
  },
});
