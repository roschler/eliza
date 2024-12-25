import {Character, elizaLogger} from "@ai16z/eliza";
import {tryLoadFile} from "./utils.ts";

/**
 * Given a character property that has a "file:" reference, load and return
 *  the content from the specified file.
 *
 * @param propName - The name of the property.
 * @param propValue - The value of the property.
 */
function processFileReference(propName: string, propValue: string): string | null {
    // Extract the file path by removing the "file:" prefix
    const filePath = propValue.substring("file:".length);

    // Ensure the file path is not empty
    if (!filePath) {
        throw new Error(`Property "${propName}" has an invalid file reference with an empty path.`);
    }

    // Log the resolution process
    elizaLogger.debug(
        `Resolving "file:" reference found in character property named ("${propName}") using file path: ${filePath}`
    );

    // Load the file content and assign it back to the property
    const fileContent = tryLoadFile(filePath);

    return fileContent;
}

/**
 * Given a character property that has an "http:" or "https:"
 *  reference, fetch and return the content from the specified
 *  URL.
 *
 * @param character - The character that owns the property.
 * @param propName - The name of the property.
 * @param propValue - The value of the property.
 */
async function processUrlReference(character: Character, propName: string, propValue: string): Promise<string | null> {
    // Extract the file path by removing the "file:" prefix
    const url = propValue.trim();

    // Log the resolution process
    elizaLogger.debug(
        `Resolving "http:" or "https:" reference found in character property named ("${propName}") with URL: ${url}`
    );

    // Load the file content and assign it back to the property
    let urlContent = null;

    try {

        const response = await fetch(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    character_name: character.name
                }),
            }
        );

        const jsonObj = await response.json();

        // Content is expected to be in the "text" field.
        urlContent = jsonObj;
    } catch (error) {
        console.error(`Error fetching response for URL("${url}").  Error details:\n`, error);
    }

    return urlContent;
}

/**
 * Processes a character object to resolve "file:", "http:", or "https:"
 *  references in its properties, replacing the content of those properties
 *  with the content found in the referenced file path or fetched remote
 *  content in the property value.
 *
 * @param character - The character whose properties are to be evaluated.
 *                   If a property value is a string starting with "file:",
 *                   it is treated as a file reference, the file is loaded,
 *                   and the property value is replaced with the file's
 *                   content.  If the property value starts with "http:"
 *                   or "https:", the content is fetched asynchronously
 *                   using the given URL.
 * @throws Will throw an error if the provided character is not an object.
 * @throws Will throw an error if a property has an invalid "file:", "http:",
 *  or "https:" reference.
 */
export async function processFileOrUrlReferences(character: Character): Promise<void> {
    // Validate that the input is a non-null object
    if (typeof character !== 'object' || character === null) {
        throw new Error("The provided character is not a valid object.");
    }

    // Iterate over all properties of the character object
    for (const propName in character) {
        if (Object.prototype.hasOwnProperty.call(character, propName)) {
            let externalContent: string | null;

            const propValue = (character as Record<string, any>)[propName];

            // Check if the property value is a string starting with "file:"
            if (typeof propValue === 'string') {
                if (propValue.startsWith("file:")) {

                    externalContent = processFileReference(propName, propValue);
                } else if (propValue.startsWith("http:") || propValue.startsWith("https:")) {

                    externalContent = await processUrlReference(character, propName, propValue);
                }
            }

            if (externalContent)
                (character as Record<string, any>)[propName] = externalContent;
        }
    }
}
