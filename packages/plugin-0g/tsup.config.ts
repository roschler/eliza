import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,

    // Ensure you're targeting CommonJS
    format: ["esm"],

    external: [
        "@0glabs/0g-ts-sdk",
        // Add other modules you want to externalize
    ],

    footer: {
        js: "//# sourceMappingURL=/home/rusty/Documents/GitHub/eliza/packages/plugin-0g/dist/index.js.map"
    }
});
