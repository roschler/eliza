import {Character, elizaLogger, StringOrNull} from "@ai16z/eliza";
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
 * @param propName - The name of the property.
 * @param propValue - The value of the property.
 *
 * @returns - Returns the content returned by the URL given
 *  when fetched, or NULL if the retrieval operation failed.
 */
async function processUrlReference(propName: string, propValue: string): Promise<StringOrNull> {
    // Extract the URL by trimming any whitespace
    const url = propValue.trim();

    // Log the resolution process
    elizaLogger.debug(
        `Resolving "http:" or "https:" reference found in property named ("${propName}") with URL: ${url}`
    );

    // Load the URL content and assign it back to the property
    let urlContent = null;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "text/plain" }, // Specify that we're expecting plain text
        });

        // Check if the response is OK (status code 200–299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Read the response as plain text
        urlContent = await response.text();
    } catch (error) {
        elizaLogger.error(`Error fetching response for URL("${url}"). Error details:\n`, error);
    }

    return urlContent;
}

/**
 * This function takes a property value and returns the correct content
 *  based on what it contains.
 *
 * NOTE: Currently, only string properties are allowed.
 *
 * @param propName - The name of the property.
 * @param propertyValue - The value of the property.
 *
 * @returns - If the property value contains a file reference, that content
 *  will be loaded and returned.  If it contains a URL reference, the content
 *  at that URL will be retrieved using a GET request and the received
 *  text response will be returned.  Otherwise, the property value will be
 *  returned unmodified.
 *
 * NOTE: For URL references, the expected response format is plain text.
 */
export async function processFileUrlOrStringReference(propName: string, propertyValue: any): Promise<StringOrNull> {
    const errPrefix = `(processFileUrlOrStringReference) `;

    if (propName.trim().length === 0) {
        throw new Error(`${errPrefix}The fieldName parameter is empty or invalid.`);
    }

    let retContent = null;
    let errorMsgTemplate = null;

    try {
        // Currently we only handle string fields.
        if (typeof propertyValue === "string") {
            // Check if the string to process starts with "file:" or "http" or "https".
            if (propertyValue.startsWith("file:")) {
                errorMsgTemplate = `Error loading file using file path: ${propertyValue}`;
                retContent = processFileReference(propName, propertyValue);
            } else if (propertyValue.startsWith("http:") || propertyValue.startsWith("https:")) {
                errorMsgTemplate = `Error fetching content using URL("${propertyValue}"). Error details:\n`
                retContent = await processUrlReference(`${propName}`, propertyValue);
            } else {
                // Just return the property value.
                retContent = propertyValue;
            }
        } else {
            throw new Error(`${errPrefix}Currently, only fields of type "string" are allowed.`);
        }
    } catch (error) {
        elizaLogger.error(errorMsgTemplate, error);
    }

    return retContent;
}

/**
 * Processes a character object to resolve "file:", "http:", or "https:"
 *  references in its properties, replacing the content of those properties
 *  with the content found in the referenced file path or fetched remote
 *  content in the property value.  Recursively descends into any
 *  child objects
 *
 * @param character - The character whose properties are to be evaluated.
 *
 *  NOTE: If a property value is a string starting with "file:",
 *   it is treated as a file reference, the file is loaded,
 *   and the property value is replaced with the file's
 *   content.  If the property value starts with "http:"
 *   or "https:", the content is fetched asynchronously
 *   using the given URL.
 *
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
            const propValue = (character as Record<string, any>)[propName];

            if (Array.isArray(propValue)) {
                // Process each element in the array
                for (let i = 0; i < propValue.length; i++) {
                    const arrayValue = propValue[i];

                    if (typeof arrayValue === 'object' && arrayValue !== null) {
                        // Recursively process objects in the array
                        await processFileOrUrlReferences(arrayValue);
                    } else if (typeof arrayValue === 'string') {
                        let externalContent: string | null = null;

                        // Check if the string starts with "file:" or a URL
                        if (arrayValue.startsWith("file:")) {
                            externalContent = processFileReference(propName, arrayValue);
                        } else if (arrayValue.startsWith("http:") || arrayValue.startsWith("https:")) {
                            externalContent = await processUrlReference(`${propName}[${i}]`, arrayValue);
                        }

                        // Update the array element if external content is retrieved
                        if (externalContent) {
                            propValue[i] = externalContent;
                        }
                    }
                }
            } else if (typeof propValue === 'object' && propValue !== null) {
                // Recursively process nested objects
                await processFileOrUrlReferences(propValue);
            } else if (typeof propValue === 'string') {
                let externalContent: string | null = null;

                // Check if the string starts with "file:" or a URL
                if (propValue.startsWith("file:")) {
                    externalContent = processFileReference(propName, propValue);
                } else if (propValue.startsWith("http:") || propValue.startsWith("https:")) {
                    externalContent = await processUrlReference(propName, propValue);
                }

                // Update the property value if external content is retrieved
                if (externalContent) {
                    (character as Record<string, any>)[propName] = externalContent;
                }
            }
        }
    }
}


