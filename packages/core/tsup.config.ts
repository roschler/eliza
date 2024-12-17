import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: "inline",
    inlineSources: true,
    clean: true,

    // Ensure you're targeting CommonJS
    format: ["esm"],
    tsconfig: "tsconfig.json", // Ensure tsconfig is used

    external: [
        "dotenv", // Externalize dotenv to prevent bundling
        "fs", // Externalize fs to use Node.js built-in module
        "path", // Externalize other built-ins if necessary
        "http",
        "https",
        // Add other modules you want to externalize
    ]
});
