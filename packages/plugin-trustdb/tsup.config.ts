import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,

    // Ensure you're targeting CommonJS
    format: ["esm"],

    external: [],

    footer: {
        js: "//# sourceMappingURL=/home/rusty/Documents/GitHub/eliza/packages/plugin-trustdb/dist/index.js.map"
    }
});
