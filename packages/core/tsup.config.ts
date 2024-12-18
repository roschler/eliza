import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,

    // Ensure you're targeting CommonJS
    format: ["esm"],

    // Ensure tsconfig is used
    tsconfig: "tsconfig.json",

    external: [
        "dotenv", // Externalize dotenv to prevent bundling
        "fs", // Externalize fs to use Node.js built-in module
        "path", // Externalize other built-ins if necessary
        "http",
        "https",
        // Add other modules you want to externalize
    ],

    footer: {
        js: "//# sourceMappingURL=/home/rusty/Documents/GitHub/eliza/packages/core/dist/index.js.map"
    }
});
