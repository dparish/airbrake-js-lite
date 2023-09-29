import typescript from "@rollup/plugin-typescript";
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
    minify: true,
    sourcemap: true,
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      output: {
      },
      plugins: [
        // @ts-ignore
        typescript({
          exclude: ["**/*.test.ts"],
        }),
      ],
    },
  },
});
