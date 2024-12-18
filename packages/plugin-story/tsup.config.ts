import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,

    // Ensure you're targeting CommonJS
    format: ["esm"],

    external: [
        "dotenv", // Externalize dotenv to prevent bundling
        "fs", // Externalize fs to use Node.js built-in module
        "path", // Externalize other built-ins if necessary
        "@reflink/reflink",
        "@node-llama-cpp",
        "https",
        "http",
        "agentkeepalive",
        "viem",
        "@lifi/sdk",
    ],

    footer: {
        js: "//# sourceMappingURL=/home/rusty/Documents/GitHub/eliza/packages/plugin-story/dist/index.js.map"
    }
});
