import * as fs from "fs/promises";
import * as path from "path";
import * as recast from "recast";
import { parse } from "@babel/parser";

const { namedTypes, builders, visit } = recast.types;

// --------------------------- Configuration ---------------------------

// Set this to your absolute base path. For example, the monorepo "packages" directory:
const DIR_SOURCE_MAP_BASE_PATH = "/home/rusty/Documents/GitHub/eliza/packages"; // TODO: Set this if needed

// Use a const variable for the sourcemap value
const sourceMapVal = "inline"; // Could be "inline", "external", etc.

// --------------------------- Helper Functions ---------------------------

/**
 * Validates the DIR_SOURCE_MAP_BASE_PATH.
 * - Throws an error if the path is empty.
 * - Throws an error if the path does not exist or is not a directory.
 */
async function validateSourceMapBasePath() {
    if (!DIR_SOURCE_MAP_BASE_PATH) {
        throw new Error(
            "❌ ERROR: DIR_SOURCE_MAP_BASE_PATH is empty. Please set it to an absolute path."
        );
    }

    try {
        const stats = await fs.stat(DIR_SOURCE_MAP_BASE_PATH);
        if (!stats.isDirectory()) {
            throw new Error(
                `❌ ERROR: DIR_SOURCE_MAP_BASE_PATH (${DIR_SOURCE_MAP_BASE_PATH}) exists but is not a directory.`
            );
        }
    } catch (err: any) {
        if (err.code === "ENOENT") {
            throw new Error(
                `❌ ERROR: DIR_SOURCE_MAP_BASE_PATH (${DIR_SOURCE_MAP_BASE_PATH}) does not exist.`
            );
        } else {
            throw new Error(
                `❌ ERROR: Unable to access DIR_SOURCE_MAP_BASE_PATH (${DIR_SOURCE_MAP_BASE_PATH}): ${err.message}`
            );
        }
    }
}

/**
 * Creates a backup of the original configuration file by copying it and appending `.bak`.
 *
 * @param filePath - The path to the original tsup configuration file.
 */
async function backupFile(filePath: string) {
    const backupPath = `${filePath}.bak`;
    try {
        await fs.copyFile(filePath, backupPath);
        console.log(`📦 Created backup: ${backupPath}`);
    } catch (err) {
        console.error(`❌ Failed to create backup for ${filePath}:`, err);
        throw err;
    }
}

/**
 * Processes a single tsup configuration file:
 * - Parses the file into an AST.
 * - Dynamically determines the workspace name from the filePath.
 * - Constructs a SOURCE_MAP_URL using the workspace name and appending "/dist/[name].js.map".
 * - Ensures `sourcemap` is set using `sourceMapVal`.
 * - Ensures `footer` is an object with a `js` field referencing the dynamically built SOURCE_MAP_URL.
 * - Creates a backup before writing changes back.
 *
 * @param filePath - The path to the tsup configuration file.
 */
async function processTsupConfig(filePath: string) {
    try {
        const fileContent = await fs.readFile(filePath, "utf-8");

        // Parse the file content into an AST using Babel parser
        const ast = recast.parse(fileContent, {
            parser: {
                parse(source: string) {
                    return parse(source, {
                        sourceType: "module",
                        plugins: ["typescript", "jsx"],
                    });
                },
            },
        });

        // Extract the workspace name from the file path
        // Example: /home/rusty/Documents/GitHub/eliza/packages/plugin-aptos/tsup.config.ts
        // workspaceName = "plugin-aptos"
        const workspaceName = path.basename(path.dirname(filePath));

        // Build a workspace-specific SOURCE_MAP_URL
        // For example: /home/rusty/Documents/GitHub/eliza/packages/plugin-aptos/dist/[name].js.map
        const SOURCE_MAP_URL = `${DIR_SOURCE_MAP_BASE_PATH}/${workspaceName}/dist/[name].js.map`;

        let contentsModified = false; // Tracks if changes are made

        // This function returns TRUE if the given AST node matches
        //  the given property name, FALSE if not.
        function isPropNameMatch(prop: ObjectProperty, propName: string): boolean {
            const retVal = namedTypes.Identifier.check(prop.key) && prop.key.name === propName ||
            prop.value?.value === propName;

            return retVal;
        }

        // VISIT PASS 1: Modify existing properties as needed, but don't filter out node properties.
        visit(ast, {
            visitCallExpression(path) {
                const { node } = path;

                // Check if node is defineConfig(...)
                if (
                    namedTypes.Identifier.check(node.callee) &&
                    node.callee.name === "defineConfig"
                ) {
                    const args = node.arguments;

                    // Ensure `defineConfig` is called with a single object argument
                    if (args.length === 1 && namedTypes.ObjectExpression.check(args[0])) {
                        const configObject = args[0];

                        // Filter properties to only include Property or ObjectProperty nodes
                        let configProps = configObject.properties.filter(
                            (prop): prop is recast.types.namedTypes.Property | recast.types.namedTypes.ObjectProperty => {
                            return namedTypes.Property.check(prop) || namedTypes.ObjectProperty.check(prop);
                        });

                        // Modify existing sourcemap or footer if they exist
                        for (const prop of configProps) {
                            // Check if this is the 'sourcemap' property
                            if (
                                isPropNameMatch(prop, "sourcemap")
                            ) {
                                prop.value = builders.literal(sourceMapVal);
                                contentsModified = true;
                                console.log(`🔧 Modified sourcemap setting in ${filePath} to '${sourceMapVal}'`);
                            }

                            // Check if this is the 'footer' property
                            if (
                                isPropNameMatch(prop, "footer")
                            ) {
                                // `footer` must be an object with a `js` field
                                const footerObject = builders.objectExpression([
                                    builders.objectProperty(
                                        builders.identifier("js"),
                                        builders.stringLiteral(`//# sourceMappingURL=${SOURCE_MAP_URL}`)
                                    ),
                                ]);

                                prop.value = footerObject;
                                contentsModified = true;
                                console.log(`🔧 Modified footer to use ${SOURCE_MAP_URL} in ${filePath}`);
                            }
                        }

                        // Check if 'sourcemap' property exists after modifications
                        const hasSourcemap = configProps.some(
                            (prop) =>
                                isPropNameMatch(prop, "sourcemap")
                        );

                        if (!hasSourcemap) {
                            configObject.properties.push(
                                builders.objectProperty(
                                    builders.identifier("sourcemap"),
                                    builders.literal(sourceMapVal)
                                )
                            );
                            contentsModified = true;
                            console.log(`🔧 Added sourcemap: "${sourceMapVal}" to ${filePath}`);
                        }

                        // Check if 'footer' property exists after modifications
                        const hasFooter = configProps.some(
                            (prop) =>
                                isPropNameMatch(prop, "footer")
                        );

                        // If we are not using "inline" source maps and the
                        //  config file does not have a footer, add one.
                        if (sourceMapVal !== "inline" && !hasFooter) {
                            // Create footer as an object with a js field
                            const footerObject = builders.objectExpression([
                                builders.objectProperty(
                                    builders.identifier("js"),
                                    builders.stringLiteral(`//# sourceMappingURL=${SOURCE_MAP_URL}`)
                                ),
                            ]);

                            configObject.properties.push(
                                builders.objectProperty(
                                    builders.identifier("footer"),
                                    footerObject
                                )
                            );
                            contentsModified = true;
                            console.log(`🔧 Added footer with ${SOURCE_MAP_URL} to ${filePath}`);
                        }

                        return false; // Stop traversing this defineConfig call
                    }
                }

                this.traverse(path);
            },
        });

        // VISIT PASS 2: Filter out unwanted properties, if required.
        if (sourceMapVal === "inline") {
            visit(ast, {
                visitObjectExpression(path) {
                    const {node} = path;

                    // Filter properties to remove the "footer" property
                    node.properties = node.properties.filter((prop) => {

                        const bKeepProperty = !isPropNameMatch(prop, "footer");

                        if (!bKeepProperty)
                            // We have changed the tree.
                            contentsModified = true;

                        return bKeepProperty;
                    });

                    return false; // Stop traversal here
                },
            });
        }

        if (contentsModified) {
            // Create a backup before writing changes
            await backupFile(filePath);

            // Generate the updated code
            const updatedCode = recast.print(ast).code;

            // Write back the updated configuration
            await fs.writeFile(filePath, updatedCode, "utf-8");
        } else {
            console.log(`✔️ No changes made to ${filePath}`);
        }
    } catch (err: any) {
        console.error(`❌ Error processing ${filePath}:`, err.message);
    }
}

/**
 * Recursively searches for `tsup.config.js` and `tsup.config.ts` files starting from `dir`,
 * and processes each found file using `processTsupConfig`.
 *
 * @param dir - The directory from which to start searching.
 */
async function findAndProcessConfigs(dir: string) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Skip node_modules and hidden directories
                if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
                // Recurse into subdirectories
                await findAndProcessConfigs(fullPath);
            } else if (
                entry.isFile() &&
                (entry.name === "tsup.config.js" || entry.name === "tsup.config.ts")
            ) {
                // Process the tsup configuration file
                await processTsupConfig(fullPath);
            }
        }
    } catch (err: any) {
        console.error(`❌ Error reading directory ${dir}:`, err.message);
    }
}

/**
 * Main function:
 * - Validates DIR_SOURCE_MAP_BASE_PATH.
 * - Initiates the search from the current working directory.
 * - Processes all tsup config files found.
 */
async function main() {
    try {
        console.log(`🚀 Validating DIR_SOURCE_MAP_BASE_PATH...`);
        await validateSourceMapBasePath();

        console.log(`✅ DIR_SOURCE_MAP_BASE_PATH is set to: ${DIR_SOURCE_MAP_BASE_PATH}`);
        const startDir = process.cwd();
        console.log(`🚀 Searching for tsup.config.js/ts in ${startDir}`);

        await findAndProcessConfigs(startDir);
        console.log("✅ All done!");
    } catch (err: any) {
        console.error(err.message);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("❌ Unexpected Error:", err);
    process.exit(1);
});
