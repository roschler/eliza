/**
 * This is the message template for the pick license
 *  context.
 */

// -------------------- BEGIN: PICK LICENSE TEMPLATE ------------

import {readPromptTextFileOrDie} from "../prompts/code/prompt-helpers";

/**
 * This is the message template when the current context is
 *  helping the user pick the right Story Protocol license.
 *
 *  We load it at runtime from the prompts templates
 *   directory.
 */
export const pickLicenseTemplate =
    readPromptTextFileOrDie('system-prompt-for-license-assistant-form-fill-agent.txt');

// -------------------- END  : PICK LICENSE TEMPLATE ------------
