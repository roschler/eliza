// This module contains code for working with
//  the various LLM prompt texts (message templates)


// -------------------- BEGIN: LOAD PROMPT BUILDER TEXT FILES ------------

// We need to load the system, tips, and perhaps other source files
//  from disk first, since they are used to build the full prompt
//  passed to the LLM, along with the user's input.

import {readTextFile} from "../../system/common-routines";

/**
 * Load one of our LLM prompt files (message templates).  If the
 *  source text file can not be found in our directory for those, or
 *  if there is a problem loading it, an error is thrown.
 *
 * @param {String} primaryFileName - The primary file name of the
 *  source file to load.
 *
 * @return {String} Returns the text content found in the source
 *  file.
 */
export function readPromptTextFileOrDie(primaryFileName: string) {
    // The agent runs in the context of the "agent" path.
    // TODO: Find a better way to access text files.  Can
    //  tsup help with this?
    const fullFilePath = `./node_modules/@ai16z/plugin-pilterms/src/prompts/text-files/${primaryFileName}` ;

    const textContent = readTextFile(fullFilePath);

    if (textContent === null)
        throw new Error(`Unable to the load LLM prompt file using file name:\n${primaryFileName}`);

    return textContent;
}
