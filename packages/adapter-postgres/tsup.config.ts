import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",

    // Do not enable source maps here or we will end up with two
    //  source map URLs, since tsup is doing the same thing.
    // sourcemap: true,
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
        "uuid",
        // Add other modules you want to externalize
    ],

    footer: {
        js: "//# sourceMappingURL=/home/rusty/Documents/GitHub/eliza/packages/adapter-postgres/dist/index.js.map"
    },

    sourcemap: true
});
