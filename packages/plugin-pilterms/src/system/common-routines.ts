// This module contains some utility functions.

import * as fs from 'fs';
import { StringOrNull } from "./types"

// The strategy has changed from using environment variables to using the AWS Secrets Manager.
//  So the get environment variable functions actually look for a secrets object first and
//  use that.  If one is not found then it falls back to environment variables.

// This method returns TRUE if the current environment variable settings indicate that
//  we are on our local Linux development station.  Otherwise FALSE is returned.
export function isDevEnv(): boolean
{
	if (typeof process.env.LINUX_DEV === undefined || process.env.LINUX_DEV == null)
		// Not on development Linux station.
		return false;

	// Is the environment variable set to the value TRUE?
	let bIsDevEnv = process.env.LINUX_DEV === 'true';

	return bIsDevEnv;
}

/**
 * Simple helper function to conform error objects that may also be plain strings
 * 	to a string error message.
 *
 * @param {Object|string|null} err - The error object, or error message, or NULL.
 *
 * @return {String} - Returns the err value itself if it's a string.  If err is
 *  an object and it has a 'message property, it will return the err.message
 *  property value.  Otherwise, the default empty value is returned.
 */
export function conformErrorObjectMsg(err: any)
{
	let errMsg = '(none)';

	if (typeof err == 'string')
		errMsg = err;
	else
	{
		if (err && err.message)
			errMsg = err.message;
	}

	return errMsg;
}

/**
 * Reads the given string content from the specified file path.
 *
 * @param {string} fullFilePath - The full path to the file.
 *
 * @returns {string | null} - Returns the contents of the file if
 *  it exists, or NULL if not.
 */
export function readTextFile(fullFilePath: string): string | null {
	const errPrefix = '(readTextFile) ';

	// Validate fullFilePath
	if (typeof fullFilePath !== 'string' || fullFilePath.trim() === '') {
		throw new Error(`${errPrefix}fullFilePath must be a non-empty string.`);
	}

	let fileContent: string | null = null;

	try {
		fileContent = fs.readFileSync(fullFilePath, 'utf8');
	} catch (err) {
		throw new Error(`${errPrefix}Failed to read file: ${(err as Error).message}`);
	}

	return fileContent;
}

/**
 * Writes the given string content to the specified file path.
 * The file path and content are validated for correctness.
 *
 * @param fullFilePath - The full path to the file.
 * @param strContent - The string content to write to the file.
 * @param bAppendFile - If TRUE, then the string content
 *  will be appended to the specified file.  If FALSE, it
 *  will overwrite the contents of the specified file.
 *
 * @returns {boolean} - Returns true on successful write, or
 *  throws an error if the operation fails.
 */
export function writeTextFile(
		fullFilePath: string,
		strContent: string,
		bAppendFile: boolean=false): boolean {
	const errPrefix = '(writeTextFile) ';

	// Validate fullFilePath
	if (typeof fullFilePath !== 'string' || fullFilePath.trim() === '') {
		throw new Error(`${errPrefix}fullFilePath must be a non-empty string.`);
	}

	// Validate strContent
	if (typeof strContent !== 'string') {
		throw new Error(`${errPrefix}strContent must be a string.`);
	}

	try {
		if (bAppendFile)
			fs.writeFileSync(fullFilePath, strContent, { encoding: 'utf8' });
		else
			fs.writeFileSync(fullFilePath, strContent, { flag: 'a', encoding: 'utf8' });

		return true;
	} catch (err) {
		throw new Error(`${errPrefix}Failed to write to file: ${(err as Error).message}`);
	}
}


/**
 * Helper function to get the current Unix timestamp.
 *
 * @returns {number} - The current Unix timestamp.
 */
export function getUnixTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

/**
 * Extracts the content between the first occurrence of an opening square bracket (`[`)
 * and the last occurrence of a closing square bracket (`]`) in a given string.
 *
 * @param str - The input string to process. Must be a non-empty string.
 * @returns - The content between the brackets, excluding the brackets themselves.
 *                            Returns `null` if no valid bracketed content is found.
 * @throws {Error} - Throws an error if the input is not a non-empty string.
 *
 * @example
 * const result = extractTopBracketedContent("Here is some [example content] to extract.");
 * console.log(result); // Output: "example content"
 */
export function extractTopBracketedContent(str: string): StringOrNull {
	// Validate that str is a non-empty string
	if (typeof str !== 'string' || str.length === 0) {
		throw new Error("Input must be a non-empty string");
	}

	// Find the first occurrence of an opening square bracket
	let start = -1;
	for (let i = 0; i < str.length; i++) {
		if (str[i] === '[') {
			start = i;
			break;
		}
	}

	// If no opening bracket is found, return null
	if (start === -1) {
		return null;
	}

	// Find the last occurrence of a closing square bracket
	let end = -1;
	for (let i = str.length - 1; i >= 0; i--) {
		if (str[i] === ']') {
			end = i;
			break;
		}
	}

	// If no closing bracket is found, or if it appears before the opening bracket, return null
	if (end === -1 || end <= start) {
		return null;
	}

	// Extract and return the content between the brackets
	return str.slice(start + 1, end);
}

/**
 * Extracts all unique variable names found in a template string.
 * Variable names are expected to be in the format ${variableName}.
 *
 * @param str - The template string to search for variable names.
 * @returns An array of unique variable names (strings) found
 *  in the template string, compatible with
 *  `Record<string, any>` type.
 */
export function findAllTemplateVarNames(str: string): string[] {
	if (!str || typeof str !== 'string') {
		throw new Error("The input must be a non-empty string.");
	}

	const templateVariablePattern = /\${(.*?)}/g;
	const variableNames = new Set<string>();

	let match;
	while ((match = templateVariablePattern.exec(str)) !== null) {
		const variableName = match[1].trim();
		if (variableName) {
			variableNames.add(variableName);
		}
	}

	return Array.from(variableNames);
}

/**
 * Replaces all template variable references in a given string with the values
 * provided by the `funcDoTheEval` callback, which evaluates each variable name.
 *
 * @param llmPromptToFixUp - The template string with variables in the format ${variableName}.
 * @param funcDoTheEval - A callback function that takes a variable name and returns its value.
 * @returns The fully substituted string with all template variables replaced by their values.
 * @throws An error if any referenced variable is missing in `funcDoTheEval`.
 */
export function substituteWithoutEval(llmPromptToFixUp: string, funcDoTheEval: (varName: string) => any): string {
	if (!llmPromptToFixUp || typeof llmPromptToFixUp !== 'string') {
		throw new Error("The input prompt must be a non-empty string.");
	}

	const variableNames = findAllTemplateVarNames(llmPromptToFixUp);

	// Create a Record of variable names and their evaluated values
	const variablesRecord: Record<string, any> = {};
	variableNames.forEach(variableName => {
		const value = funcDoTheEval(variableName); // Evaluates in caller's scope
		if (typeof value === 'undefined') {
			throw new Error(`Variable '${variableName}' is undefined.`);
		}
		variablesRecord[variableName] = value;
	});

	// Substitute variables in the template string using the evaluated values
	return llmPromptToFixUp.replace(/\${(.*?)}/g, (_, variableName) => {
		return String(variablesRecord[variableName]);
	});
}

/**
 * Appends an end-of-sentence (EOS) character (e.g., ".", "!", "?") to a string if not already present.
 * Validates that the input string is non-empty after trimming.
 *
 * @param str - The input string to validate and potentially modify.
 * @returns The input string with an EOS character appended if not already present.
 * @throws {Error} If the input string is empty after trimming.
 */
export function appendEosCharIfNotPresent(str: string): string {
	if (!str.trim()) {
		throw new Error("Input string cannot be empty after trimming.");
	}

	const eosChars = ['.', '!', '?'];
	return eosChars.includes(str.trim().slice(-1)) ? str : `${str}.`;
}
