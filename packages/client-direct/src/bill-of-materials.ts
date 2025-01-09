// This module contains the bill-of-materials form fill related code.

import {
    elizaLogger,
    BillOfMaterialsLineItem,
    Objective,
    ObjectiveOrNull,
    StringOrNull,
    State,
    formatMessagesWithStopAtStrings,
    NEW_SESSION_MESSAGE_AS_DELIMITER,
    IAgentRuntime,
    Content,
    Goal,
    composeContext,
    ModelClass,
    generateMessageResponse,
    messageCompletionFooter
} from "@ai16z/eliza";

// -------------------------- BEGIN: SOME CONSTANTS ------------------------

/**
 * If the developer did not assign a help document to the bill-of-materials
 *  line item's helpDocumentForBomLineItem property, then we will use this
 *  generic help.
 */
const DEFAULT_BOM_HELP_DOCUMENT =
    `
    Analyze the recent chat message history to see how you can provide
    help to the user's current question.
`;

// -------------------------- END  : SOME CONSTANTS ------------------------

// -------------------------- BEGIN: SOME ERROR MESSAGES ------------------------

/**
 * The error message we output in various places when a function
 *  that interprets the response from a bill-of-materials related
 *  LLM operation in a useful manner.
 */
export const ERROR_MESSAGE_FAILED_BOM_LLM_RESPONSE_ANALYSIS = `(The system failed to interpret the LLM response properly.)`;

// -------------------------- END  : SOME ERROR MESSAGES ------------------------

// -------------------------- BEGIN: HELP RESPONSE CATEGORIES ------------------------

/**
 * These are various help response category values that are used
 *  to classify the last chat volley that occurs during a
 *  bill-of-materials line item operation that has entered
 *  HELP mode (i.e. - switching from data collection mode
 *  to answering questions from the user about the current
 *  bill-of-materials line item.
 */
export enum enumHelpResponseCategory {

    // >>>>> These help response categories are output by the LLM that
    //  does the result check for help chat volleys initiated during
    //  a bill-of-materials line item session.
    /**
     * The user wants to abandon the session. The response
     *  text is the text the user used to indicate that.
     */
    CANCEL = "CANCEL",

    /**
     * The user has indicated that their question has been
     *  fully answered.  The response text is the text the
     *  user used to indicate that.
     */
    ANSWERED = "ANSWERED",

    /**
     * The user doesn't understand the help information you
     * have just gave them. The response text is the text the
     * user used to indicate that.
     */
    CONFUSED = "CONFUSED",

    /**
     * The user has asked another question or wants more details
     * on the current subject. The response text is the text
     * the user used to ask another question or request more
     * details on the current subject.
     */
    HELP = "HELP",

    // These values are NOT output by the LLM, but by the
    //  bill-of-materials related JavaScript code instead.

    /**
     * This value is used when the LLM failed to output a
     *  proper help response category.  It is a signal to
     *  the bill-of-materials code to ask the user again
     *  a recent question, or to clarify a current one,
     *  hoping that on the next pass a usable result is
     *  found in the recent messages.
     */
    RETRY = "RETRY",
}

/**
 * Checks if a given string matches any value in the enumHelpResponseCategory enum,
 * case-insensitive.
 *
 * @param str - The input string to check.
 * @returns `true` if the input matches any enum value (case-insensitive), otherwise `false`.
 */
export function isValidHelpResponseCategory(str: string): boolean {
    if (!str) {
        return false; // Handle empty or null input
    }

    // Convert the input string to uppercase and compare with the enum values
    return Object.values(enumHelpResponseCategory).includes(str.toUpperCase() as enumHelpResponseCategory);
}

/**
 * These are various help response category values that are used
 *  to classify the user input in the last chat volley during an
 *  optional bill-of-materials line item's preliminary question.
 */
export enum enumPreliminaryQuestionResultCategory {

    // >>>>> These preliminary question response categories are output
    //  by the LLM that does the result check for a recently asked
    //  preliminary question initiated during an OPTIONAL bill-of-materials
    //  line item session.

    /**
     * The user gave an answer that indicates they want to stop the
     *  entire session.
     */
    CANCEL = "CANCEL",

    /**
     * The user has indicated that they are interested in the
     *  optional bill-of-materials line item.
     */
    TRUE = "TRUE",

    /**
     * The user has indicated that they are NOT interested in the
     *  optional bill-of-materials line item.
     */
    FALSE = "FALSE",

    /**
     * The user has asked a question about the subject matter
     *  the current bill-of-materials line item involves. The
     *  response text is the text the user used to is a request
     *  for more information.
     */
    HELP = "HELP",

    // These values are NOT output by the LLM, but by the
    //  bill-of-materials related JavaScript code instead.

    /**
     * This value is used when the LLM failed to output a
     *  proper help response category.  It is a signal to
     *  the bill-of-materials code to ask the user again
     *  a recent question, or to clarify a current one,
     *  hoping that on the next pass a usable result is
     *  found in the recent messages.
     */
    RETRY = "RETRY",
}

/**
 * Checks if a given string matches any value in the
 *  enumPreliminaryQuestionResultCategory enum,
 *  case-insensitive.
 *
 * @param str - The input string to check.
 *
 * @returns `true` if the input matches any enum value
 *  (case-insensitive), otherwise `false`.
 */
export function isValidPreliminaryQuestionResponseCategory(str: string): boolean {
    if (!str) {
        return false; // Handle empty or null input
    }

    // Convert the input string to uppercase and compare with the enum values
    return Object.values(enumPreliminaryQuestionResultCategory).includes(str.toUpperCase() as enumPreliminaryQuestionResultCategory);
}

/**
 * This is the type of the object that is built as the
 *  result of a HELP mode result check.
 */
export type helpResultCheckResponse = {
    // The category assigned to the current chat context.
    category: string;
    // The most relevant text or all the text the user
    //  gave that triggered the category selection.
    text: string;
}

// -------------------------- END  : HELP RESPONSE CATEGORIES ------------------------

// -------------------------- BEGIN: UTILITY BOM RELATED FUNCTIONS ------------------------

/**
 * This function builds a CANCEL response for cancel request by the
 *  user during a bill-of-materials line item handling session.
 *
 * @param runtime - A valid agent object.
 * @param callerErrPrefix - The error prefix of the calling method.
 *   Used for creating log messages.
 */
export function buildBomCancelResponse(runtime: IAgentRuntime, callerErrPrefix: string): Content {
    const errPrefix = `(buildBomCancelResponse) `;

    if (callerErrPrefix.trim().length < 1) {
        throw new Error(`${errPrefix}The callerErrPrefix parameter is empty.`);
    }

    // The user wants to cancel the session.  Get the name of the agent/character
    //  the developer wants control transferred to.
    //  If we don't have an agent/character to switch control to
    //  in the event of a user cancellation request, then that is
    //  an error.
    const nextCharacterName =
        runtime.character.switchToCharacterWhenBomSessionCancelled;

    if (typeof nextCharacterName !== "string" || typeof nextCharacterName === "string" && nextCharacterName.trim().length === 0) {
        throw new Error(`${callerErrPrefix}The user has requested the cancelling of the bill-of-materials session, but the character does not specify the next agent to transfer control to (i.e. - switchToCharacterWhenBomSessionCancelled is unassigned or invalid.`);
    }

    // Create a response with the action that will transfer control of the conversation
    //  to the next agent/character.
    const response = {
        text: `Cancelling your session and transferring you over to the next agent: ${nextCharacterName}`,
        action: `SELECT_CHARACTER_${nextCharacterName}`
    }

    return response;
}

/**
 * This function merges a field with the given name and value into the
 *  provided State object.  The bomFieldName will become the property
 *  name used in the field value assignment.
 *
 * @param state - A valid State object.
 * @param bomFieldName - The name of the bill-of-materials field that
 *  should be assigned to the property in the State object of the same
 *  name.
 * @param bomFieldValue - The value to assign.
 */
export function mergeBomFieldIntoState(state: State, bomFieldName: string, bomFieldValue: string): void {
    const errPrefix = `(mergeBomFieldIntoState) `;

    if (bomFieldName.trim().length === 0) {
        throw new Error(`${errPrefix}The bomFieldName parameter is empty.`);
    }

    if (bomFieldValue.trim().length === 0) {
        throw new Error(`${errPrefix}The bomFieldValue parameter is empty.`);
    }

    state[bomFieldName] = bomFieldValue.trim();
}

// -------------------------- END  : UTILITY BOM RELATED FUNCTIONS ------------------------

// -------------------------- BEGIN: RESULT CHECK MESSAGE TEMPLATES ------------------------

// The following message templates are used during a bill-of-materials form
//  fill operation, when we ask the LLM to categorize the recent message
//  history, and to extract any new result data from that history.

/**
 * This is the message template we use to ask the LLM if the user
 *  answered a previously asked preliminary question associated with
 *  an objective that carries a bill-of-materials line item.
 */
const preliminaryQuestionLLmResultCheckTemplate =
    `
    Your task is to analyze your recent chat interactions with the user and determine if
    they have definitively answered the following question:

    QUESTION: {{simpleQuestion}}

    Here is your recent chat history with the user:

    {{recentMessages}}

    The user's answer will fall into one of the following categories. Each line below is a category definition and is formatted like this:  Each line starts with the string "CATEGORY:", followed by the category name in uppercase letters, with everything after that followed by a description of the category, until the next category line begins.

    CATEGORY: "TRUE", An answer that equates to boolean true.  For example, "yes", "sure", "Ok", etc.
    CATEGORY: "FALSE", An answer that equates to boolean false.  For example, "no", "not interested", "I don't want to do that", "I don't need that", "Nah", "I'm OK without that" etc.
    CATEGORY: "QUERY", A query about the subject matter the question involves that indicates the user wants more information on the subject.
    CATEGORY: "CANCEL", The user has indicated that they want to stop the entire session.

    Determine the correct category and then give your answer in JSON format as described here:
    \`\`\`json
    {
        "category": "<put the category name here>",
        "text": "<put the user text here that made you choose the category>"
    }\`\`\`
    `;

/**
 * This is the message template we use to ask the LLM if the user
 *  answered a previously asked main question associated with
 *  an objective that carries a bill-of-materials line item.
 */
const mainQuestionLLmResultTemplate =
    `
    Your task is to analyze your recent chat interactions with the user and determine if
    they have definitively answered the following question that requested a vital piece
    of information from the user:

    QUESTION: {{simpleQuestion}}

    Here is your recent chat history with the user:

    {{recentMessages}}

    If the user provided a valid answer to the information request, then your answer
    should be that value and just the value, without any surrounding text that isn't
    part of the value, and the category of the answer is "RESULT".

    If the user asked a question about the subject matter the question involves, thus
    indicating the user wants more information on the subject, then your answer
    should be that question and just the question, without any surrounding text that isn't
    related to the question, and the category of the answer is "QUERY".

    If the user indicated that they have changed their mind and are no longer
    interested in the question asked, or want to do something completely different,
    or they want to cancel the current chat,  then your answer should be the user's statement,
    and the category of the answer is "CANCEL".

    Determine the category and then give your complete reply in JSON format as described here:
    \`\`\`json
    {
        "category": "Put the category here you selected",
        "result_value": "If the user provided a valid answer put it here, otherwise, put the word null here."
    }\`\`\`
    `;


/**
 * This is the message template we use to check for a result
 *  condition when we are in HELP mode.  We pass this to the
 *  LLM to have it analyze the recent chat history and let us
 *  know if the user has indicated that it's help query has
 *  been properly answered.
 */
const helpModeResultCheckTemplate =
    `
    You are a helpful assistant whose goal is to analyze recent
     messages in your chat history with the user, and to detect
     the following conditions.  Each condition is preceded by
     the CATEGORY label that is assigned to condition, followed by a colon,
     the definition of the condition, and finally, the response text definition:

     - ANSWERED: The user has indicated that their question has been fully answered.  The response text is the text the user used to indicate that.
     - CANCEL:: The user wants to abandon the session. The response text is the text the user used to indicate that.
     - HELP: The user has asked another question or wants more details on the current subject. The response text is the text the user used to ask another question or request more details on the current subject.
     - CONFUSED: The user doesn't understand the help information you have just gave them. The response text is the text the user used to indicate that.

    Here is your recent chat history with the user:

    {{recentMessages}}

    You must output your answer in JSON format, as described here:

    \`\`\`json
    {
        "category": "<put the category that identifies the nature of your response here>",
        "text": "<put your response text here>"
    }\`\`\`
    `;

// -------------------------- END  : RESULT CHECK MESSAGE TEMPLATES ------------------------

// -------------------------- BEGIN: UTILITY MESSAGE TEMPLATES ------------------------

// These are some utility message templates used for various dedicated
//  LLM call, like when we switch into HELP mode during a bill-of-materials
//  line item operation.

/**
 * This is the message template we use to when we switch into
 *  HELP mode, in response to a user request for information
 *  (query) during a bill-of-materials line item answering
 *  operation.
 */
const helpModeMessageTemplate =
    `
    You are a helpful assistant whose goal is to answer a user's
    specific questions.  Here is a help document you should use
    to answer the user's question.  Feel free to include any
    knowledge you inherently know about the subject, as long as it
    is directly relevant to the user's question:

    {{helpDocument}}

    Help the user explore the topic as long as they have questions.  If you don't know the answer to a question, be honest about that.

    Here is your recent chat history with the user:

    {{recentMessages}}

    Create a response that answers the users question, or ask them a question instead if you need more information to answer their question properly, or to disambiguate the current conversation context.  Make sure you always end your response text with some variant of the question:

    "Did you get the answer needed?"
    "Have I answered your question fully?"
    "Do you need more information?"

    You must output your response as a JSON object, using this format:

    \`\`\`json
    {
        "text": "<put your response text to the user here>"
    }\`\`\`
    `;

// -------------------------- END  : UTILITY MESSAGE TEMPLATES ------------------------

// -------------------------- BEGIN: BILL-OF-MATERIALS SUB-PROMPT PROCESSING ------------------------

/**
 * An agent/character is considered a bill-of-materials agent/character
 *  if it has a non-empty array of BillOfMaterialsLineItem objects.
 *
 * @param runtime - The agent/character to inspect.
 *
 * @returns - Returns TRUE if the given agent/character is a bill-of-materials
 *  agent/character, FALSE if not.
 */
export function isBomAgentCharacter(runtime: IAgentRuntime): boolean {
    return Array.isArray(runtime.character.billOfMaterials) && runtime.character.billOfMaterials.length > 0;
}

/**
 * Validate the given BillOfMaterialsLineItem by checking the logical
 *  consistency of its fields.
 *
 * @param billOfMaterialsLineItem - The BillOfMaterialsLineItem to inspect.
 *
 * @returns - Returns an error message indicating where validation
 *  failed, or NULL if the object validated.
 */
export function validateBillOfMaterialsLineItem(billOfMaterialsLineItem: BillOfMaterialsLineItem): string {
    const validationFailures: string[] = [];

    if (billOfMaterialsLineItem.name.trim().length === 0) {
        validationFailures.push(`The "name" field is empty.`);
    }

    if (billOfMaterialsLineItem.type.trim().length === 0) {
        validationFailures.push(`The "type" field is empty.`);
    }

    if (billOfMaterialsLineItem.prompt.trim().length === 0) {
        validationFailures.push(`The "prompt" field is empty.`);
    }

    if (typeof billOfMaterialsLineItem.defaultValue === 'string' && billOfMaterialsLineItem.defaultValue.trim().length === 0) {
        validationFailures.push(`The "defaultValue" field is assigned an empty string.`);
    }

    // If this line item is marked as optional, then we MUST have a preliminary
    //  question to ask the user, to see if they are interested in the line item.
    if (billOfMaterialsLineItem.isOptional) {
        if (typeof billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem !== "string"
            || (typeof billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem === "string" && billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem.length === 0)) {
            validationFailures.push(`The "preliminaryPromptForOptionalLineItem" field is missing or is assigned an empty string for a line items marked as "optional".`);
        }

        if (typeof billOfMaterialsLineItem.helpDocumentForBomLineItem !== "string"
            || (typeof billOfMaterialsLineItem.helpDocumentForBomLineItem === "string" && billOfMaterialsLineItem.helpDocumentForBomLineItem.length === 0)) {
            validationFailures.push(`The "helpTextForOptionalLineItem" field is missing or is assigned an empty string for a line items marked as "optional".`);
        }
    }

    if (billOfMaterialsLineItem.type === 'string') {
        // -------------------------- BEGIN: STRING TYPE VALIDATIONS ------------------------
        // If the list of values array is assigned, then it must contain
        //  at least one value.

        if (Array.isArray(billOfMaterialsLineItem) && billOfMaterialsLineItem.listOfValidValues.length === 0) {
            validationFailures.push(`The "listOfValidValues" array is empty.`);
        }

        // -------------------------- END  : STRING TYPE VALIDATIONS ------------------------
    } else if (billOfMaterialsLineItem.type === 'number') {
        // -------------------------- BEGIN: NUMBER TYPE VALIDATIONS ------------------------

        // If we have a minimum and maximum value field, make sure the
        //  minimum is less than or equal to the maximum value.
        if (typeof billOfMaterialsLineItem.minVal === 'number' && typeof billOfMaterialsLineItem.maxVal === 'number') {
            if (billOfMaterialsLineItem.minVal > billOfMaterialsLineItem.maxVal)
                validationFailures.push(`The minVal field value(${billOfMaterialsLineItem.minVal}) is greater than the maxVal field value: ${billOfMaterialsLineItem.maxVal}.`);
        }

        if (typeof billOfMaterialsLineItem.unitsDescription === 'string' && billOfMaterialsLineItem.unitsDescription.trim().length === 0) {
            validationFailures.push(`The unitsDescription field is empty.`);
        }

        // -------------------------- END  : NUMBER TYPE VALIDATIONS ------------------------
    }

    if (validationFailures.length > 0) {
        return validationFailures.join('\n');
    } else {
        return null;
    }
}

/**
 * Given an array of BillOfMaterialsLineItem objects, determine the
 *  next objective that needs to be completed.
 *
 * NOTE: The selected, if any, BillOfMaterialsLineItem object
 *  will be validated before being returned.
 *
 * @param bomGoal - A Goal object that was prepared for use as a
 *  bill-of-materials purposes.
 *
 * @returns - Returns NULL if all of the bill-of-materials objectives
 *  for the goal have been completed, otherwise, the next incomplete
 *  objective found sequentially in the BillOfMaterialsLineItem
 *  objects array is returned.
 */
export function getNextBomObjective(bomGoal: Goal): ObjectiveOrNull {
    let nextBomObject: ObjectiveOrNull = null;

    if (!Array.isArray(bomGoal.objectives)) {
        throw new Error(`The bomGoal parameter's "objectives" field is not an array.`);
    }

    if (bomGoal.objectives.length === 0) {
        throw new Error(`The bomGoal parameter's "objectives" array is empty.`);
    }

    // Find the first bill-of-materials objective that is not completed.
    for (let objectiveNdx = 0; objectiveNdx < bomGoal.objectives.length; objectiveNdx++) {
        const bomObjective = bomGoal.objectives[objectiveNdx];

        // Is it an incomplete bill-of-materials objective object?
        if (!bomObjective.completed && bomObjective.billOfMaterialsLineItem) {
            // Yes. Validate the objective's bill-of-materials line item object.
            //  It will return an error message describing all the validation
            //  checks that failed, if any occurred, or NULL all validations
            //  succeeded.
            const validationFailureMsgs =
                validateBillOfMaterialsLineItem(bomObjective.billOfMaterialsLineItem);

            if (validationFailureMsgs)
            {
                throw new Error(`Invalid bill-of-materials line item object encountered.  Details:\n${validationFailureMsgs}.`);
            }

            // Select this bill-of-materials objective to be processed
            //  this chat volley.
            nextBomObject = bomObjective;
            break; // Cease iteration.
        }
    }

    return nextBomObject;
}

/**
 * This function builds a stop-at-strings array that when used with
 *  the formatMessagesWithStopAtStrings() function, will stop collecting
 *  messages when the beginning of a new session is found, or when
 *  a recently asked question was found.  This is to prevent the
 *  mistaking of old answers to bill-of-materials questions from
 *  the previous session, as current answers.
 *
 * @param recentlyAskedQuestion - The recently asked bill-of-materials
 *  question we are checking the message history for to find an
 *  answer to that question..
 *
 * @returns - Returns an array with the new session demarcating
 *  string in it along with the recently asked bill-of-materials
 *  question.
 */
export function buildBomStopAtStringsArray(recentlyAskedQuestion: string): string[] {
    const errPrefix = `(buildBomStopAtStringsArray) `;

    if (recentlyAskedQuestion.trim().length < 1) {
        throw new Error(`${errPrefix}The recentlyAskedQuestion parameter is an empty string. `);

    }

    return [
        NEW_SESSION_MESSAGE_AS_DELIMITER,
        recentlyAskedQuestion
    ];
}

/**
 * This function makes an LLM call get the next help text for
 *  the user when the current bill-of-materials objective is
 *  in HELP mode.
 *
 * @param runtime - The current agent/character.
 * @param state - The current system state for the chat
 * @param currentBomObjective - The current bill-of-materials
 *  objective.
 * @param category - The category the LLM determined reflects
 *  best the user's help request.
 *
 * @returns - Returns a Content object that contains the
 *  response the system should use as the chat volley
 *  response, OR, returns NULL indicating the calling
 *  code should continue
 */
async function askLlmBomHelpQuestion(runtime: IAgentRuntime, state: State, currentBomObjective: Objective, category: string): Promise<Content> {
    const errPrefix = `(askLlmBomHelpQuestion) `;

    elizaLogger.debug(`The category assigned to the user's last help request or response is: ${category}`);

    // Put the objective's help text into the state before we compose the context.
    state.helpDocument =
        // We prefer there to be a full help document attached to the current
        //  line item.
        currentBomObjective.billOfMaterialsLineItem.helpDocumentForBomLineItem
        ??
        // If not, use the generic help text.
        DEFAULT_BOM_HELP_DOCUMENT;

    // Do the substitution variable replacements.
    const useFormattedMessage = composeContext({
        state: state,
        template: helpModeMessageTemplate
    });

    // Default response, in case we fail to interpret the result
    //  check properly.
    let response: Content | null = null;

    const responseFromLlm = await generateMessageResponse({
        runtime: runtime,
        context: useFormattedMessage,
        modelClass: ModelClass.SMALL,
    });

    if (typeof responseFromLlm.text !== 'string') {
        elizaLogger.debug(`${errPrefix}Unable to find a "text" property in the LLM output.`);
    }

    // The response should have a "text" properties.
    const text = responseFromLlm.text ?? '(The bill-of-materials help LLM failed to produce a JSON object with a "text" property.)';

    // Use the help text provided by the LLM.
    response = {
        text: text
    }

    return response;
}

/**
 * This function makes an LLM call to have the recent messages
 *  analyzed as part of a bill-of-materials HELP mode operation.
 *
 * @param runtime - The current agent/character.
 * @param state - The current system state for the chat
 * @param currentBomObjective - The current bill-of-materials
 *  objective.
 *
 * @returns - Returns a Content object that contains the
 *  response the system should use as the chat volley
 *  response, OR, returns NULL indicating the calling
 *  code should continue to determine what to do and
 *  say next, based on the current state of the chat
 *  and system.
 */
async function bomHelpModeCheckResultHandler(
    runtime: IAgentRuntime,
    state: State,
    currentBomObjective: Objective): Promise<Content | null> {
    const errPrefix = `(bomHelpModeCheckResultHandler) `;

    // This function should only be called during HELP mode.
    if (!currentBomObjective.isInHelpMode) {
        throw new Error(`${errPrefix}This function should only be called in the context of a bill-of-materials HELP mode operation.`);
    }

    // Do the substitution variable replacements.
    const useFormattedMessage = composeContext({
        state: state,
        template: helpModeResultCheckTemplate
    });

    // Default response, in case we fail to interpret the result
    //  check properly.
    let response: Content | null = null;

    const responseFromLlm = await generateMessageResponse({
        runtime: runtime,
        context: useFormattedMessage,
        modelClass: ModelClass.SMALL,
    });

    // Examine the response and determine how it affects the current
    //  chat.  The response should have "category" and "text"
    //  properties.

    let category = responseFromLlm.category;
    let text = responseFromLlm.text ?? '(none)';

    if (typeof category !== 'string' || (typeof category === 'string'  && !isValidHelpResponseCategory(category))) {
        elizaLogger.debug(`Unable to find a valid help response category in the LLM output.  Setting response category to RETRY.`);

        // Set the category to RETRY to let the calling code we should
        //  try asking the user the current bill-of-materials line item
        //  question again, or to ask the user to clarify their question.
        category = enumHelpResponseCategory.RETRY;
    }

    category = (category as string).toUpperCase();

    elizaLogger.debug(`${errPrefix}The selected CATEGORY for help mode is: ${category}\nAssociated text: ${text}\nObjective description: ${currentBomObjective.description}`);

    // -------------------------- BEGIN: CATEGORY BASED UPDATES ------------------------

    if (category === enumHelpResponseCategory.ANSWERED) {
        // The user has indicated that their question has been fully
        //  answered.  Exit HELP mode.
        elizaLogger.debug(`Exiting HELP mode during current bill-of-materials object: ${currentBomObjective.description}`);
        currentBomObjective.isInHelpMode = false;

        // We don't create a response because we want the question
        //  building code that follows to resume the bill-of-materials
        //  information gathering operation.
    } else if (category === enumHelpResponseCategory.CANCEL) {
        // Build a CANCEL response.
        response =
            buildBomCancelResponse(runtime, errPrefix);
    } else if (category === enumHelpResponseCategory.CONFUSED) {
        // The user is confused by the help we have given them.  Create
        //  a response that helps them with this confusion.
        //
        // TODO: Create something more powerful to handle specifically the
        //  situation where the user doesn't understand the help given
        //  so far.
        response =
            await askLlmBomHelpQuestion(runtime, state, currentBomObjective, category);

    } else if (category === enumHelpResponseCategory.HELP) {
        // The user needs more help. Create a response that helps them with
        //  this confusion.
        response =
            await askLlmBomHelpQuestion(runtime, state, currentBomObjective, category);
    } else {
        throw new Error(`${errPrefix}Unknown help response category: ${category}`);
    }

    // -------------------------- END  : CATEGORY BASED UPDATES ------------------------

    return response;
}

/**
 * This function makes an LLM call to have the recent messages
 *  analyzed as part of a bill-of-materials OPTIONAL line item
 *  question operation.
 *
 * @param runtime - The current agent/character.
 * @param state - The current system state for the chat
 * @param currentBomObjective - The current bill-of-materials
 *  objective.
 *
 * @returns - Returns a Content object that contains the
 *  response the system should use as the chat volley
 *  response, OR, returns NULL indicating the calling
 *  code should continue
 */
async function bomPreliminaryQuestionCheckResultHandler(
    runtime: IAgentRuntime,
    state: State,
    currentBomObjective: Objective): Promise<Content | null> {
    const errPrefix = `(bomPreliminaryQuestionCheckResultHandler) `;

    // This function should NOT be called during HELP mode.
    if (currentBomObjective.isInHelpMode) {
        throw new Error(`${errPrefix}This function should NOT be called in the context of a bill-of-materials HELP mode operation.`);
    }

    // Put the objective's preliminary question into the state before we compose the context.
    mergeBomFieldIntoState(state, "simpleQuestion", currentBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem);

    // Do the substitution variable replacements.
    const useFormattedMessage = composeContext({
        state: state,
        template: preliminaryQuestionLLmResultCheckTemplate
    });

    // Default response, in case we fail to interpret the result
    //  check properly.
    let response: Content | null = null;

    const responseFromLlm = await generateMessageResponse({
        runtime: runtime,
        context: useFormattedMessage,
        modelClass: ModelClass.SMALL,
    });

    // Examine the response and determine how it affects the current
    //  chat.  The response should have a "category" and "text"
    //  properties.
    let category = responseFromLlm.category;
    let text = responseFromLlm.text ?? '(none)';

    // WE MUST have a category.  If not, we create a RETRY response in the
    //  hope the next chat volley will result in a category being generated
    //  by the LLM.
    if (typeof category !== 'string' || (typeof category === 'string'  && !isValidPreliminaryQuestionResponseCategory(category))) {
        elizaLogger.debug(`${errPrefix}Unable to find a valid preliminary question response category in the LLM output.  Setting response category to RETRY.`);

        // Set the category to RETRY to let the calling code we should
        //  try asking the user the current bill-of-materials line item
        //  question again, or to ask the user to clarify their question.
        category = enumHelpResponseCategory.RETRY;
    }

    category = (category as string).toUpperCase();

    elizaLogger.debug(`${errPrefix}The selected CATEGORY for optional line item preliminary mode is: ${category}\nAssociated text: ${text}\nObjective description: ${currentBomObjective.description}`);

    // -------------------------- BEGIN: CATEGORY BASED UPDATES ------------------------

    if (category === enumPreliminaryQuestionResultCategory.CANCEL) {
        // Build a CANCEL response.
        response =
            buildBomCancelResponse(runtime, errPrefix);
    } else if (category === enumPreliminaryQuestionResultCategory.TRUE) {
        // The user is interested in the OPTIONAL bill-of-materials line
        //  item.  Update the current objective to indicate that.
        currentBomObjective.isOptionalFieldDesiredByUser = true;
    } else if (category === enumPreliminaryQuestionResultCategory.FALSE) {
        // The user is NOT interested in the OPTIONAL bill-of-materials line
        //  item.  Update the current objective to indicate that.
        currentBomObjective.isOptionalFieldDesiredByUser = false;
    } else if (category === enumPreliminaryQuestionResultCategory.HELP) {
        // The user needs more help. Create a response that helps them with
        //  this confusion.
        response =
            await askLlmBomHelpQuestion(runtime, state, currentBomObjective, category);
    } else {
        throw new Error(`${errPrefix}Unknown help response category: ${category}`);
    }

    // -------------------------- END  : CATEGORY BASED UPDATES ------------------------

    return response;
}

/**
 * Analyze the recent message stream to see how we should proceed
 *  with the current chat volley.
 *
 * @param runtime - The current agent/character.
 * @param state - The current system state.
 * @param currentBomObjective - The current bill-of-materials objective.
 *
 * @returns - Returns the response that should
 */
export async function determineBomQuestionResult(
    runtime: IAgentRuntime,
    state: State,
    currentBomObjective: Objective): Promise<Content> {
    const errPrefix = `(determineBomQuestionResult) `;

    if (currentBomObjective === null) {
        throw new Error(`${errPrefix}The currentBomObjective parameter is unassigned.`);
    }

    // First, we need to determine the right message template to use
    //  to give to the LLM, to move the bill-of-materials session
    //  ahead, and then we need to replace the substitution variables
    //  using the current state.s
    // let useFormattedMessage: string | null = null;

    let response: Content | null = null;

    // Are we in help mode?
    if (currentBomObjective.isInHelpMode) {
        // -------------------------- BEGIN: HELP MODE ------------------------

        // Have the LLM analyze the chat messages so far and update the
        //  goal and its objectives based on that analysis.
        response = await bomHelpModeCheckResultHandler(runtime, state, currentBomObjective);

        // -------------------------- END  : HELP MODE ------------------------
    }

    // Do we have a direct response, based on the result checks?
    if (response) {
        // Yes.  Use it as is.
    } else {
        // No.  Validate the current context and if OK, allow
        //  the NULL response to be returned so buildBillOfMaterialQuestion()
        //  can craft a new bill-of-materials question.
        //
        // Is the current bill-of-materials line item optional?
        if (currentBomObjective.billOfMaterialsLineItem.isOptional) {
            // -------------------------- BEGIN: OPTIONAL LINE ITEM ------------------------

            // Yes. Check for a declined optional line item, since those
            //  should not be passed to this function.
            if (currentBomObjective.resultData === null) {
                throw new Error(`${errPrefix}The bill-of-materials line item object is marked as OPTIONAL, yet the objective's resultData is set to NULL, indicating the user declined it.  This objective should never have been passed to buildBillOfMaterialQuestion() in the first place.`);
            }

            // Check to make sure we asked the preliminary question in a previous chat volley,
            //  which should have happened via the buildBillOfMaterialQuestion() function call
            //  made during that volley. If not, that's an error.
            const stopAtStrings =
                buildBomStopAtStringsArray(currentBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem);

            // Retrieve the message history up until the preliminary question or
            //  the start of the latest session.  We limit the scope of the
            //  chat message history this way to avoid processing user responses
            //  that don't belong to the current session, but belong to an
            //  old session instead.
            const recentMessagesFilteredString =
                formatMessagesWithStopAtStrings(
                    {
                        messages: state.recentMessagesData,
                        actors: state.actorsData,
                        stopAtStrings: stopAtStrings
                    });

            // Was the preliminary question asked?
            const bIsPreliminaryQuestionAsked =
                recentMessagesFilteredString.includes(currentBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem);

            if (!bIsPreliminaryQuestionAsked) {
                // No.  That's a serious error.
                throw new Error(`${errPrefix}The preliminary question for the current optional bill-of-materials line item has not been asked, which should have happened by now.`);
            }

            // Has the preliminary question been properly answered?  Analyze
            //  the chat message history for a result.
            response =
                await bomPreliminaryQuestionCheckResultHandler(runtime, state, currentBomObjective);


            // Leave the response null so that buildBillOfMaterialQuestion() is
            //  executed to build the next response.

            // -------------------------- END  : OPTIONAL LINE ITEM ------------------------
        } else {
            // -------------------------- BEGIN: MAIN QUESTION FOR OPTIONAL OR NON-OPTIONAL LINE ITEM ------------------------

            // Leave the response null so that buildBillOfMaterialQuestion() is
            //  executed to build the next response.

            // -------------------------- END  : MAIN QUESTION FOR OPTIONAL OR NON-OPTIONAL LINE ITEM ------------------------
        } // else/if (currentBomObjective.billOfMaterialsLineItem.isOptional)
    } // else/if (currentBomObjective.isInHelpMode)

    return response;
}

/**
 * Build the main bill-of-materials question text from a bill-of-materials
 *  objective.
 *
 * @param currentBomObjective - The current bill-of-materials objective.
 *
 * @returns - Returns the fully assembled text that asks the question contained
 *  in the bill-of-materials objective.
 */
export function buildBomMainQuestion(currentBomObjective: Objective): string {
    const errPrefix = `(buildBomMainQuestion) `;

    // We need to adjust the question to encompass any validations
    //  declared in the bill-of-materials line item.
    let retText = currentBomObjective.billOfMaterialsLineItem.prompt;

    if (currentBomObjective.billOfMaterialsLineItem.type === 'string') {
        // -------------------------- BEGIN: STRING TYPE ------------------------

        if (Array.isArray(currentBomObjective.billOfMaterialsLineItem.listOfValidValues) && currentBomObjective.billOfMaterialsLineItem.listOfValidValues.length > 0) {
            // Add list of values if present.
            const validChoices =
                currentBomObjective.billOfMaterialsLineItem.listOfValidValues.join(', ');
            retText +=
                `Available choices are: ${validChoices}`;
        }

        // -------------------------- END  : STRING TYPE ------------------------
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'number') {
        // -------------------------- BEGIN: NUMBER TYPE ------------------------

        // Add min/max constraints if present.
        const bIsMinValPresent = typeof currentBomObjective.billOfMaterialsLineItem.minVal === 'number';
        const bIsMaxValPresent = typeof currentBomObjective.billOfMaterialsLineItem.maxVal === 'number';

        if (bIsMaxValPresent && bIsMinValPresent) {
            // >>>>> Minimum AND Maximum values present.

            // Sanity check on the min/max values.
            if (currentBomObjective.billOfMaterialsLineItem.minVal > currentBomObjective.billOfMaterialsLineItem.maxVal) {
                throw new Error(`${errPrefix}The minimum value for the bill-of-materials numeric line item(${currentBomObjective.billOfMaterialsLineItem.minVal}) is greater than the maximum value: ${currentBomObjective.billOfMaterialsLineItem.maxVal}`);
            }

            retText +=
                `Please choose a number between: ${currentBomObjective.billOfMaterialsLineItem.minVal} && ${currentBomObjective.billOfMaterialsLineItem.maxVal}.`;
        } else if (bIsMinValPresent) {
            // >>>>> ONLY minimum value present.

            retText +=
                `Please choose a number greater than or equal to: ${currentBomObjective.billOfMaterialsLineItem.minVal}.`;

        } else if (bIsMaxValPresent) {
            // >>>>> ONLY maximum value present.

            retText +=
                `Please choose a number less than or equal to: ${currentBomObjective.billOfMaterialsLineItem.maxVal}.`;
        } else {
            throw new Error(`${errPrefix}Invalid logic pathway encountered during bill-of-materials numeric line item processing.`);
        }

        // -------------------------- END  : NUMBER TYPE ------------------------
    } if (currentBomObjective.billOfMaterialsLineItem.type === 'boolean') {
        // -------------------------- BEGIN: BOOLEAN TYPE ------------------------

        // No text modifications needed for boolean questions.

        // -------------------------- END  : BOOLEAN TYPE ------------------------
    } else {
        throw new Error(`${errPrefix}Unknown bill-of-materials type: ${currentBomObjective.billOfMaterialsLineItem.type}`);
    }

    return retText;
}

/**
 * Given an agent/character bill-of-materials goal, use
 *  its bill-of-materials Goal content to create the sub-prompt
 *  for the LLM that facilitates completing the bill-of-materials
 *  objectives.
 *
 * @param currentBomObjective - The current bill-of-materials Objective
 *   object that needs to be processed.
 *
 * @returns - Returns NULL if the goal has no
 *  bill-of-materials content, or if it does, returns the
 *  bill-of-materials sub-prompt made from that content.
 */
export function buildBillOfMaterialQuestion(currentBomObjective: Objective): string | null {
    const errPrefix = `(buildBillOfMaterialQuestion) `;

    let retStr: StringOrNull = null;

    const piecesOfPrompt: string[] = [];

    if (currentBomObjective === null) {
        throw new Error(`${errPrefix}The nextBomObjective parameter is unassigned.`)
    }

    // -------------------------- BEGIN: HELP MODE ------------------------

    // -------------------------- END  : HELP MODE ------------------------

    // -------------------------- BEGIN: PROCESS NEW OBJECTIVE ------------------------

    let bIsTimeForThePreliminaryQuestion = false;

    // Is the objective's bill-of-materials line item object optional?
    if (currentBomObjective.billOfMaterialsLineItem.isOptional) {
        // Yes. Check for a declined optional line item, since those
        //  should not be passed to this function.
        if (currentBomObjective.resultData === null) {
            throw new Error(`${errPrefix}The bill-of-materials line item object is marked as OPTIONAL, yet the objective's resultData is set to NULL, indicating the user decline interest in it, so it should never have been passed to buildBillOfMaterialQuestion() in the first place.`);
        }

        // If the objective does not have a result yet, then we need to ask the
        //  preliminary question now.
        if (typeof currentBomObjective.resultData === 'undefined' && currentBomObjective.isOptionalFieldDesiredByUser) {
            // -------------------------- BEGIN: PRELIMINARY QUESTION FOR OPTIONAL LINE ITEM ------------------------

            // Yes.  Ask the user the question that determines if they are interested
            //  in the optional line item or not.
            piecesOfPrompt.push(currentBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem);

            // -------------------------- END  : PRELIMINARY QUESTION FOR OPTIONAL LINE ITEM ------------------------

            // Set the flag to let subsequent code now we are processing
            //  an optional line item's preliminary question, not its
            //  main question.
            bIsTimeForThePreliminaryQuestion = true;
        }
    }

    // Are we asking the preliminary question for an optional line item now?
    if (!bIsTimeForThePreliminaryQuestion) {
        // No.  We are asking the main question, optional line item or not.

        // -------------------------- BEGIN: MAIN LINE ITEM QUESTION ------------------------

        const bomMainQuestion =
            buildBomMainQuestion(currentBomObjective);

        piecesOfPrompt.push(bomMainQuestion);

        // -------------------------- END  : MAIN LINE ITEM QUESTION ------------------------
    }

    // -------------------------- END  : PROCESS NEW OBJECTIVE ------------------------

    if (piecesOfPrompt.length > 0) {
        // Assemble the sub-prompt for the bill-of-materials line item processing.
        retStr = piecesOfPrompt.join('\n\n');
    }

    return retStr;
}

// -------------------------- END  : BILL-OF-MATERIALS SUB-PROMPT PROCESSING ------------------------

export const messageHandlerTemplate =
    // {{goals}}
    `
#
# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export interface SimliClientConfig {
    apiKey: string;
    faceID: string;
    handleSilence: boolean;
    videoRef: any;
    audioRef: any;
}

