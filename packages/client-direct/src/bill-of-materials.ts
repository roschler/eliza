// This module contains the bill-of-materials form fill related code.

/**
 * BILL-OF-MATERIALS NOTES:
 *
 *  The general flow the bill-of-materials code consists of the following
 *      functional groups, in order of usage during processing:
 *
 *      - Help mode facilitators for when the current bill-of-materials is in HELP mode
 *      - Result check handlers that analyze the most recent chat messages to:
 *
 *              + If HELP mode is active, then check to see if the user's help query
 *                 has been fully answered
 *              + If the current bill-of-materials main question is an OPTIONAL
 *                 line item, then check to see if the preliminary question has
 *                 been answered
 *              + OPTIONAL or not, then check to see if the current bill-of-materials
 *                 main question has been answered with a valid result data value
 *
 *      - A question builder function that builds the correct question for the
 *         current, or newly current, bill-of-materials objective.
 *
 *  RESPONSE GENERATION:
 *
 *  The bill-of-materials code chain works by the strategy of having the most
 *   relevant code generate a response (e.g. - next help response, or result
 *   value validation failure, etc.) that becomes the overall response returned
 *   to the Eliza core.  Otherwise, no response is generated and then it
 *   becomes the responsibility of the question builder function to create
 *   the response.
 *
 * BILL-OF-MATERIALS MINI-MAP:
 *
 *         determineBomQuestionResult()
 *              bomHelpModeCheckResultHandler()
 *
 *              bomPreliminaryQuestionCheckResultHandler()
 *              | -> extractMainQuestionResultValue()
 *
 *              bomMainQuestionCheckResultHandler()
 *              extractMainQuestionResultValue()
 *                 [ switch character action ]
 *
 *              validateMainQuestionResultValue
 *              | -> Object's resultData property is assigned here
 */

import {
    elizaLogger,
    BillOfMaterialsLineItem,
    Objective,
    ObjectiveOrNull,
    StringOrNull,
    State,
    END_SESSION_MESSAGE_AS_DELIMITER,
    IAgentRuntime,
    Content,
    Goal,
    composeContext,
    ModelClass,
    generateMessageResponse,
    messageCompletionFooter,
    ContentOrNull,
    ResultAndCharacterName,
    ExtractedResultValueOrErrorResponse,
    END_OBJECTIVE_MESSAGE_AS_DELIMITER,
    createEndSessionMemory,
    UUID,
    isUuid,
    createEndObjectiveMemory
} from "@ai16z/eliza";
import {CLIENT_NAME} from "./common.ts";
import {processFileUrlOrStringReference} from "./process-external-references.ts";

// -------------------------- BEGIN: SOME CONSTANTS ------------------------

// This is the catch-all response to an invalid result value during
//  a bill-of-materials line item session.
const defaultInvalidResultValueResponse: Content = {
    text: `Sorry.  I didn't understand your response.  Please try again.`
}

/**
 * If the developer did not assign a help document to the bill-of-materials
 *  line item's helpDocument property, then we will use this
 *  generic help.
 */
const DEFAULT_BOM_HELP_DOCUMENT =
    `
    Use your knowledge to help the user as best as you can
    `;


// -------------------------- END  : SOME CONSTANTS ------------------------

// -------------------------- BEGIN: SOME ERROR MESSAGES ------------------------

/**
 * The error message we output in various places when a function
 *  that interprets the response from a bill-of-materials related
 *  LLM operation in a useful manner.
 */
// export const ERROR_MESSAGE_FAILED_BOM_LLM_RESPONSE_ANALYSIS = `(The system failed to interpret the LLM response properly.)`;

// -------------------------- END  : SOME ERROR MESSAGES ------------------------

// -------------------------- BEGIN: HELP RESPONSE CATEGORIES ------------------------

/**
 * These are various help response category values that are used
 *  to classify the last chat volley that occurs during a
 *  bill-of-materials line item operation that has entered
 *  HELP mode (i.e. - switching from data collection mode
 *  to answering questions from the user about the current
 *  bill-of-materials line item.
 *
export enum enumHelpResponseCategory {

    // >>>>> These help response categories are output by the LLM that
    //  does the result check for help chat volleys initiated during
    //  a bill-of-materials line item session.
    /**
     * The user wants to abandon the session. The response
     *  text is the text the user used to indicate that.
     *
    CANCEL = "CANCEL",

    /**
     * The user has indicated that their question has been
     *  fully answered.  The response text is the text the
     *  user used to indicate that.
     *
    ANSWERED = "ANSWERED",

    /**
     * The user doesn't understand the help information you
     * have just gave them. The response text is the text the
     * user used to indicate that.
     *
    CONFUSED = "CONFUSED",

    /**
     * The user has asked another question or wants more details
     * on the current subject. The response text is the text
     * the user used to ask another question or request more
     * details on the current subject.
     *
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
     *
    RETRY = "RETRY",
}
*/

/**
 * Checks if a given string matches any value in the enumHelpResponseCategory enum,
 * case-insensitive.
 *
 * @param str - The input string to check.
 * @returns `true` if the input matches any enum value (case-insensitive), otherwise `false`.
 *
export function isValidHelpResponseCategory(str: string): boolean {
    if (!str) {
        return false; // Handle empty or null input
    }

    // Convert the input string to uppercase and compare with the enum values
    return Object.values(enumHelpResponseCategory).includes(str.toUpperCase() as enumHelpResponseCategory);
}
*/

/**
 * These are various preliminary question category values that are used
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
     * The user has not yet given an answer that can be definitively
     *  answered as TRUE or FALSE, so the current preliminary
     *  bill-of-materials line item sub-session should continue.
     */
    CONTINUE = "CONTINUE",

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

    // These values are NOT output by the LLM, but by the
    //  bill-of-materials related JavaScript code instead.

    /**
     * This value is used when the LLM failed to output a
     *  proper preliminary question category.  It is a signal to
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
 * These are various main question response category values that are used
 *  to classify the user input in the last chat volley during an
 *  optional bill-of-materials line item's main question.
 */
export enum enumMainQuestionResultCategory {

    // >>>>> These main question response categories are output
    //  by the LLM that does the result check for a recently asked
    //  main question initiated during an bill-of-materials
    //  line item session, optional line item or not.

    /**
     * The user gave an answer that indicates they want to stop the
     *  entire session.
     */
    CANCEL = "CANCEL",

    /**
     * The user has indicated that they want to change their answer
     *  to something different.
     */

    /**
     * This value is used when the LLM is determined that
     *  the user gave a satisfactory answer to the
     *  current objective's question.
     */
    RESULT = "RESULT",

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
 *  enumMainQuestionResultCategory enum,
 *  case-insensitive.
 *
 * @param str - The input string to check.
 *
 * @returns `true` if the input matches any enum value
 *  (case-insensitive), otherwise `false`.
 */
export function isValidMainQuestionResponseCategory(str: string): boolean {
    if (!str) {
        return false; // Handle empty or null input
    }

    // Convert the input string to uppercase and compare with the enum values
    return Object.values(enumMainQuestionResultCategory).includes(str.toUpperCase() as enumMainQuestionResultCategory);
}

/**
 * This is the type of the object that is built as the
 *  result of a result check.
 */
export type resultCheckResponse = {
    // The category assigned to the current chat context.
    category: string;
    // The most relevant text or all the text the user
    //  gave that triggered the category selection.
    text: string;
}

/**
 * Simple type to bind a choice to the character name that should
 *  be switched to if that choice is selected by the user.
 */
export type ChoiceAndCharacterName = {
    // The choice value from a bill-of-materials line item's
    //  listOfValidValues property
    choice: string;
    // The name of the agent/character that should be switched to
    //  if the user selects this choice.  If NULL, then no switching
    //  will take place.
    characterName: StringOrNull;
}

// -------------------------- END  : HELP RESPONSE CATEGORIES ------------------------

// -------------------------- BEGIN: UTILITY BOM RELATED FUNCTIONS ------------------------

/**
 * This function takes a choice, which may have an optional character/agent
 *  name appended to it, and returns a ChoiceAndCharacterName object built
 *  from it.
 *
 * @param choice - The raw text choice for one of the valid values in a
 *  bill-of-materials line item's listOfValidValues field, found in the
 *  character's JSON.
 */
function parseChoiceIntoChoiceAndCharacterName(choice: string): ChoiceAndCharacterName {
    const errPrefix = `(parseChoiceIntoChoiceAndCharacterName) `;

    const delimCharacterName = ':';

    const choiceTrimmed = choice.trim();

    if (choiceTrimmed.length === 0) {
        throw new Error(`${errPrefix}The choice input parameter is empty or invalid.`);
    }

    let retChoiceAndCharacterName: ChoiceAndCharacterName = {
        choice: choiceTrimmed,
        characterName: null
    }

    const pieces = choiceTrimmed.split(delimCharacterName);

    if (pieces.length > 1) {
        const lastNdx = pieces.length - 1;

        // The second parameter to the slice parameter is exclusive bound.
        retChoiceAndCharacterName.choice = pieces.slice(0, lastNdx).join(' ').trim();

        // Last element is the character name.
        retChoiceAndCharacterName.characterName = pieces[lastNdx].trim();

        // It's OK if there is no character name, but an empty character
        //  name is not allowed.
        if (retChoiceAndCharacterName.characterName.length === 0) {
            throw new Error(`${errPrefix}The character name for the following list of values choice is empty: ${choiceTrimmed}`);
        }
    }

    return retChoiceAndCharacterName;
}

/**
 * This function parses all the valid values in the list into an array of choice
 *  and agent/character name objects.
 *
 * @param listOfValidValues - The list of valid values from a bill-of-materials
 *  line item object.
 *
 * @returns - Returns an array of ChoiceAndCharacterName objects build from the
 *  listOfValidValues given.  Any choices that did not have the agent/character
 *  name suffix appended to the choice text, will have NULL for the
 *  characterName field in that object.
 */
function buildChoiceAndCharacterNamesArray(listOfValidValues: string[]): ChoiceAndCharacterName[] {
    const errPrefix = `(buildChoiceAndCharacterNamesArray) `;

    if (listOfValidValues.length === 0) {
        throw new Error(`${errPrefix}The listOfValidValues array input parameter is empty.`);
    }

    const choiceAndCharacterNameArray: ChoiceAndCharacterName[] = [];

    // Parse all the valid values in the list into an array of choice
    //  and agent/character name objects.
    listOfValidValues.forEach((choice) => {
        const choiceAndCharacterNameObj =
            parseChoiceIntoChoiceAndCharacterName(choice);
        choiceAndCharacterNameArray.push(choiceAndCharacterNameObj)
    });

    return choiceAndCharacterNameArray;
}

/**
 * This function takes an array of strings and creates an "or" statement
 *  in natural language format.  (e.g. - ["cat", "dog", "emu"] would
 *  become "cat, dog, or emu".
 *
 * @param strs - The array of strings to turn into an "or" statement.
 *
 * @returns - Returns the fully assembled "or" statement.  If the
 *  strings array is empty, then an empty string is returned.
 */
export function buildBomOrStringStatement(strs: string[]): string {
    // const errPrefix = `(buildBomOrStringStatement) `;
    const delimChoices = ', ';

    let orStatement: string = '';

    if (strs.length > 0) {
        if (strs.length === 1) {
            orStatement = strs[0];
        } else {
            // The second argument to the slice function is bounds exclusive.
            orStatement += strs.slice(0, strs.length - 1).join(delimChoices);

            orStatement += `${delimChoices} or `;

            orStatement += strs[strs.length - 1];
        }
    }

    return orStatement;
}

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

// -------------------------- BEGIN: BOM MESSAGE TEMPLATES ------------------------

// These are the message templates we use to ask bill-of-materials question.

/**
 * This is the message template we use to ask the preliminary question for
 *  an OPTIONAL bill-of-materials question line item.
 */
const preliminaryQuestionLlmMessageTemplate =
    `
    Your current task is to ask the user the following question and chat with them until they give an answer that can be safely interpreted as either true or false:

    QUESTION: {{preliminaryQuestion}}

    - Answers that equate to boolean true are like the following: "yes", "sure", "Ok", "Let's do that", "I'd like that", etc.
    - Answers that equate to boolean false are like the following: "no", "not interested", "I don't want to do that", "I don't need that", "Nah", "I'm OK without that", etc.

    You can use the following help document to answer questions they may have, until they are ready to give a definitive answer:

    {{helpDocument}}

    Here is your recent chat history with the user:

    {{recentMessages}}

    You should output your response with a JSON answer like that shown below.  Your response must
    contain a category and a text field.  The category must be one of the following, based on
    your current interpretation of the progress of the chat:

    - "TRUE" if the user has given an answer that equates to true
    - "FALSE" if the user has given an answer that equates to false
    - "CANCEL" if the user has indicated that they want to stop the entire session
    - "CONTINUE" if the user has not yet answered the question in a way that can be definitively interpreted as either true or false

    The text field should contain the text that made you decide to choose your selected category.  Here are the
    rules for creating the text field:

    - If the category is "TRUE", then the text field should be the text from the user that made you choose that category
    - If the category is "FALSE", then the text field should be the text from the user that made you choose that category
    - If the category is "CANCEL", then the text field should be the text from the user that made you choose that category
    - If the category is "CONTINUE", then the text field should contain a text response that answers the users most recent question
        and helps them decide between true and false

    Here is the format of the JSON object you must output:

    \`\`\`json
    {
        "category": "<put the category you selected here>",
        "text": "<put here the text that made you choose the category>"
    }\`\`\`
    `;

/**
 * This is the DEFAULT message template we use to ask the main question for
 *  an OPTIONAL or MANDATORY bill-of-materials question line item.
 *  It will be used if the bill-of-materials line item does not provide
 *  its own message template.
 */
const mainQuestionLlmMessageTemplate =
    `
        Your current task is to ask the user the following question and chat with them until they give an answer to it:

    QUESTION: {{simpleQuestion}}

    You can use the following help document to answer questions they may have, until they are ready to give a definitive answer:

    {{helpDocument}}

    The user's input will fall into one of the categories below:

    "CANCEL", The user has indicated that they want to stop chatting with you
    "RESULT", The user has provided a valid result value that answers the question
    "CONTINUE", The user has not given a valid result value that answers the question
     yet, and you should continue chatting with them and answer any questions they have
     using the provided help document until they do give you a valid result value

    This describes the nature of the result value that answers the question

    {{resultValueHelp}}

    Here is your recent chat history with the user:

    {{recentMessages}}

    You should output your response with a JSON answer like that shown below.  Your response must
    contain a category and a text field.  The category must be one of categories above, based on
    your current interpretation of the progress of the chat.  If the category is the "RESULT"
    category, the text field value should be the result value given by the user.  Otherwise,
    the text field value should be the text in the user's input that made you choose the category:

    Here is the format of the JSON object you must output:

    \`\`\`json
    {
        "category": "<put the category you selected here>",
        "text": "<put the text you have selecte for the text field here>"
    }\`\`\`
    `;

// -------------------------- END  : BOM MESSAGE TEMPLATES ------------------------

// -------------------------- BEGIN: UTILITY MESSAGE TEMPLATES ------------------------

// These are some utility message templates used for various dedicated
//  LLM call, like when we switch into HELP mode during a bill-of-materials
//  line item operation.

/**
 * This is the message template we use to when we switch into
 *  HELP mode, in response to a user request for information
 *  (query) during a bill-of-materials line item answering
 *  operation.
 *
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
*/

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
        if (typeof billOfMaterialsLineItem.preliminaryQuestion !== "string"
            || (typeof billOfMaterialsLineItem.preliminaryQuestion === "string" && billOfMaterialsLineItem.preliminaryQuestion.length === 0)) {
            validationFailures.push(`The "preliminaryPromptForOptionalLineItem" field is missing or is assigned an empty string for a line items marked as "optional".`);
        }

        if (typeof billOfMaterialsLineItem.helpDocument !== "string"
            || (typeof billOfMaterialsLineItem.helpDocument === "string" && billOfMaterialsLineItem.helpDocument.length === 0)) {
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
 *  any of the additional stop-at-strings is found.  This is to prevent
 *  the mistaking of old answers belonging to previous bill-of-materials
 *  sessions from being mistaken as current answers.
 *
 * @param additionalStopAtStrings - Optional extra strings that
 *  you want to formatMessagesWithStopAtStrings() to use
 *  to end the reverse chronological search through messages.
 *
 * @returns - Returns an array with the new session demarcating
 *  string along with the additional stop-at-strings in it.
 */
export function buildBomStopAtStringsLastSession(...additionalStopAtStrings: string[]): string[] {
    // const errPrefix = `(buildBomStopAtStringsArray) `;

    const retStopAtStrings: string[] = [
        END_SESSION_MESSAGE_AS_DELIMITER,
        ...additionalStopAtStrings,
    ];

    return retStopAtStrings;
}

/**
 * This function builds a stop-at-strings array that when used with
 *  the formatMessagesWithStopAtStrings() function, will stop collecting
 *  messages when the end of a new objective's processing is found, or when
 *  any of the additional stop-at-strings is found.  This is to prevent
 *  the mistaking of old answers belonging to previous bill-of-materials
 *  objectives from being mistaken as current answers.
 *
 * @param additionalStopAtStrings - Optional extra strings that
 *  you want to formatMessagesWithStopAtStrings() to use
 *  to end the reverse chronological search through messages.
 *
 * @returns - Returns an array with the new objective demarcating
 *  string along with the additional stop-at-strings in it, AND
 *  the new session demarcating string in it.
 */
export function buildBomStopAtStringsLastObjective(...additionalStopAtStrings: string[]): string[] {
    const retStopAtStrings: string[] = [
        END_OBJECTIVE_MESSAGE_AS_DELIMITER,
        ...additionalStopAtStrings,
    ];

    // We always want to stop at the end of the last
    //  session.
    return buildBomStopAtStringsLastSession(...retStopAtStrings);
}

/**
 * This function makes an LLM call get the next response text for
 *  the user for the current bill-of-materials objective's MAIN
 *  question.
 *
 * @param runtime - The current agent/character.
 * @param state - The current system state for the chat
 * @param currentBomObjective - The current bill-of-materials
 *  objective.
 *
 * @returns - Returns a Content object that contains the
 *  response the system should use as the chat volley
 *  response.
 */
 async function askLlmBomMainQuestion(runtime: IAgentRuntime, state: State, currentBomObjective: Objective): Promise<Content> {
     const errPrefix = `(askLlmBomMainQuestion) `;

     const resolveHelpDocument =
         await processFileUrlOrStringReference(
             'currentBomObjective.billOfMaterialsLineItem.helpDocument',
             currentBomObjective.billOfMaterialsLineItem.helpDocument);

     // Put the objective's help text into the state before we compose the context.
     state.helpDocument =
         // We prefer there to be a full help document attached to the current
         //  line item.
         resolveHelpDocument
         ??
         // If not, use the generic help text.
         DEFAULT_BOM_HELP_DOCUMENT;

     // Do the substitution variable replacements.
     const useFormattedMessage = composeContext({
         state: state,
         template: mainTem
     });

     // Default response, in case we fail to interpret the result
     //  check properly.
     let response: ContentOrNull = null;

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
 * This function makes an LLM call get the next help text for
 *  the user when the current bill-of-materials objective is
 *  in HELP mode.
 *
 * NOTE: This function will set the isInHelp flag of the
 *  current bill-of-materials objective to TRUE, so that
 *  help mode stays in effect until the user's question
 *  is answered, or they cancel the session.
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
 *
async function askLlmBomHelpQuestion(runtime: IAgentRuntime, state: State, currentBomObjective: Objective, category: string): Promise<Content> {
    const errPrefix = `(askLlmBomHelpQuestion) `;

    elizaLogger.debug(`${errPrefix}The category assigned to the user's last help request or response is: ${category}`);

    currentBomObjective.isInHelpMode = true;

    elizaLogger.debug(`${errPrefix}isInHelp flag set to true.`);

    // Put the objective's help text into the state before we compose the context.
    state.helpDocument =
        // We prefer there to be a full help document attached to the current
        //  line item.
        currentBomObjective.billOfMaterialsLineItem.helpDocument
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
    let response: ContentOrNull = null;

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
*/

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
 *
async function bomHelpModeCheckResultHandler(
    runtime: IAgentRuntime,
    state: State,
    currentBomObjective: Objective): Promise<ExtractedResultValueOrErrorResponse> {
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
    let response: ContentOrNull = null;

    const responseFromLlm = await generateMessageResponse({
        runtime: runtime,
        context: useFormattedMessage,
        modelClass: ModelClass.SMALL,
    });

    // Examine the response and determine how it affects the current
    //  chat.  The response should have "category" and "text"
    //  properties.

    let category = responseFromLlm.category;
    const text = responseFromLlm.text ?? '(none)';

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
*/

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
    currentBomObjective: Objective): Promise<ContentOrNull> {
    const errPrefix = `(bomPreliminaryQuestionCheckResultHandler) `;

    const resolvedQuestion =
        await processFileUrlOrStringReference(
            'currentBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem',
            currentBomObjective.billOfMaterialsLineItem.preliminaryQuestion);

    // Put the objective's preliminary question into the state before we compose the context.
    mergeBomFieldIntoState(
        state,
        "simpleQuestion",
        resolvedQuestion);

    // Do the substitution variable replacements.
    const useFormattedMessage = composeContext({
        state: state,
        template: preliminaryQuestionLLmResultCheckTemplate
    });

    // Default response, in case we fail to interpret the result
    //  check properly.
    let response: ContentOrNull = null;

    const responseFromLlm = await generateMessageResponse({
        runtime: runtime,
        context: useFormattedMessage,
        modelClass: ModelClass.SMALL,
    });

    // Examine the response and determine how it affects the current
    //  chat.  The response should have a "category" and "text"
    //  properties.
    let category = responseFromLlm.category;
    const text = responseFromLlm.text ?? '(none)';

    // WE MUST have a category.  If not, we create a RETRY response in the
    //  hope the next chat volley will result in a category being generated
    //  by the LLM.
    if (typeof category !== 'string' || (typeof category === 'string'  && !isValidPreliminaryQuestionResponseCategory(category))) {
        // -------------------------- BEGIN: RETRY PROCESSING ------------------------

        elizaLogger.debug(`${errPrefix}Unable to find a valid preliminary question response category in the LLM output.  Setting response category to RETRY.`);

        // Set the category to RETRY and try asking the user the current
        //  bill-of-materials line item question again.
        category = enumPreliminaryQuestionResultCategory.RETRY;

        response = defaultInvalidResultValueResponse;

        // -------------------------- END  : RETRY PROCESSING ------------------------
    } else {

        category = (category as string).toUpperCase();

        elizaLogger.debug(`${errPrefix}The selected CATEGORY for optional line item, preliminary mode is: ${category}\nAssociated text: ${text}\nObjective description: ${currentBomObjective.description}`);

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
        } else {
            throw new Error(`${errPrefix}Unknown help response category: ${category}`);
        }
    }

    // -------------------------- END  : CATEGORY BASED UPDATES ------------------------

    return response;
}

/**
 * Finds the index of the first ChoiceAndCharacterName object in the provided array
 * whose "choice" field is considered a match for the given choice parameter.
 * Matching tolerates differences in casing, punctuation, whitespace, and quantity case.
 *
 * @param {string} choice - The input choice to match.
 * @param {ChoiceAndCharacterName[]} listOfChoiceAndCharacterNames - Array of objects to search.
 *
 * @returns {number} The index of the matching object, or -1 if no match is found.
 * @throws {Error} If the choice parameter is empty or the array is empty.
 */
function ndxOfMatchingToListOfValuesChoice(
    choice: string,
    listOfChoiceAndCharacterNames: ChoiceAndCharacterName[]
): number {
    const errPrefix = `(ndxOfMatchingToListOfValuesChoice) `;

    const choiceTrimmed = choice.trim();

    if (choiceTrimmed.length === 0) {
        throw new Error(`${errPrefix}The choice input parameter is empty or invalid.`);
    }

    if (listOfChoiceAndCharacterNames.length === 0) {
        throw new Error(`${errPrefix}The listOfChoiceAndCharacterNames array input parameter is empty.`);
    }

    /**
     * Helper function to normalize a string by:
     * - Converting to lowercase
     * - Removing punctuation
     * - Removing whitespace
     *
     * @param {string} str - The string to normalize.
     * @returns {string} The normalized string.
     */
    function normalizeString(str: string): string {
        return str
            .toLowerCase()
            .replace(/[\p{P}\p{S}]/gu, '') // Remove punctuation/symbols
            .replace(/\s+/g, ''); // Remove all whitespace
    }

    /**
     * Determines whether two strings are a match based on the specified criteria.
     *
     * @param {string} str1 - The first string to compare.
     * @param {string} str2 - The second string to compare.
     * @returns {boolean} True if the strings match, false otherwise.
     */
    function areStringsSimilar(str1: string, str2: string): boolean {
        const normalizedStr1 = normalizeString(str1);
        const normalizedStr2 = normalizeString(str2);

        // Check length difference tolerance
        if (Math.abs(normalizedStr1.length - normalizedStr2.length) > 3) {
            return false;
        }

        // Check if the strings are equivalent after normalization
        return normalizedStr1 === normalizedStr2;
    }

    // Iterate through the array to find the matching index
    for (let i = 0; i < listOfChoiceAndCharacterNames.length; i++) {
        const item = listOfChoiceAndCharacterNames[i];
        if (areStringsSimilar(choiceTrimmed, item.choice)) {
            return i;
        }
    }

    // No match found
    return -1;
}

/**
 * Finds the matching ChoiceAndCharacterName object in the provided array
 * whose "choice" field matches the given choice parameter.
 * Uses ndxOfMatchingToListOfValuesChoice to locate the index.
 *
 * @param {string} choice - The input choice to match.
 * @param {ChoiceAndCharacterName[]} listOfChoiceAndCharacterNames - Array of objects to search.
 * @returns {ChoiceAndCharacterName | null} The matching object, or null if no match is found.
 * @throws {Error} If the choice parameter is empty or the array is empty.
 */
function matchChoiceToChoiceAndCharacterName(
    choice: string,
    listOfChoiceAndCharacterNames: ChoiceAndCharacterName[]
): ChoiceAndCharacterName | null {
    const index = ndxOfMatchingToListOfValuesChoice(choice, listOfChoiceAndCharacterNames);
    return index !== -1 ? listOfChoiceAndCharacterNames[index] : null;
}

/**
 * This function takes the text isolated by and returned by the LLM in
 *  an LLM check result operation for the main question of an OPTIONAL
 *  or non-optional bill-of-materials line item, and cleans it up for
 *  use as a result value.
 *
 * @param currentBomObjective - The current bill-of-materials objective
 *  that is the source of the result text.
 * @param text - The text isolated by and returned by the LLM during an LLM check
 *  result operation. (NOT the "category" string, which should be "RESULT").
 *
 * @returns - Returns the result value found, or NULL if no result was found.
 */
function extractMainQuestionResultValue(currentBomObjective: Objective, text: string): ResultAndCharacterName {
    const errPrefix = `(extractMainQuestionResultValue) `;

    const trimmedText = text.trim();

    let resultAndCharacterNameObj: ResultAndCharacterName = {
        resultValue: null,
        characterName: null
    }

    const trimmedTextLowerCase = trimmedText.toLowerCase();

    // If the trimmed text returned by the LLM is empty,then just allow
    //  NULL to be returned to let the caller know this.
    if (trimmedTextLowerCase.length > 0) {

        if (currentBomObjective.billOfMaterialsLineItem.type === 'boolean') {
            // -------------------------- BEGIN: EXTRACT BOOLEAN VALUE ------------------------

            // If the text is TRUE of FALSE then that is the result value.
            if (trimmedTextLowerCase === "true") {
                resultAndCharacterNameObj.resultValue = true;
            } else if (trimmedTextLowerCase === "false") {
                resultAndCharacterNameObj.resultValue = false;
            } else {
                // Just leave the return value as NULL to let the caller know
                //  we did not receive a satisfactory response.
            }

            // -------------------------- END  : EXTRACT BOOLEAN VALUE ------------------------
        } else if (currentBomObjective.billOfMaterialsLineItem.type === 'number') {
            // -------------------------- BEGIN: EXTRACT NUMERIC VALUE ------------------------

            // Try to parse the number as a valid numeric value.
            try {
                resultAndCharacterNameObj.resultValue = parseFloat(trimmedTextLowerCase);
            } catch (err) {
                elizaLogger.debug(`Unable to parse text value("${trimmedTextLowerCase}") as a number.  Error details: `, err);

                // Just leave the return value as NULL to let the caller know
                //  we did not receive a satisfactory response.
            }

            // -------------------------- END  : EXTRACT NUMERIC VALUE ------------------------
        } else if (currentBomObjective.billOfMaterialsLineItem.type === 'string') {
            // -------------------------- BEGIN: EXTRACT STRING VALUE ------------------------

            if (Array.isArray(currentBomObjective.billOfMaterialsLineItem.listOfValidValues) && currentBomObjective.billOfMaterialsLineItem.listOfValidValues.length > 0) {
                // First, create an array of ChoiceAndCharacterName to separate the
                //  list of choices values from their character name suffixes, if
                //  any exist.
                const listOfChoiceAndCharacterNames: ChoiceAndCharacterName[] =
                    buildChoiceAndCharacterNamesArray(currentBomObjective.billOfMaterialsLineItem.listOfValidValues);

                // Validate the text returned by the result check LLM as being one of the
                //  valid choices.
                const matchingChoiceAndCharacterName =
                    matchChoiceToChoiceAndCharacterName(trimmedTextLowerCase, listOfChoiceAndCharacterNames);

                if (matchingChoiceAndCharacterName) {
                    resultAndCharacterNameObj.resultValue =matchingChoiceAndCharacterName.choice;
                    resultAndCharacterNameObj.characterName = matchingChoiceAndCharacterName.characterName;
                } else {
                    // Just leave the return value as NULL to let the caller know
                    //  we did not receive a satisfactory response.
                }
            }

            // -------------------------- END  : EXTRACT STRING VALUE ------------------------
        } else {
            // -------------------------- BEGIN: UNKNOWN TYPE ------------------------

            throw new Error(`${errPrefix}The bill-of-materials line item is of an unknown type: ${currentBomObjective.billOfMaterialsLineItem.type}`);

            // -------------------------- END  : UNKNOWN TYPE ------------------------
        }
    }

    return resultAndCharacterNameObj;
}

/**
 * This function takes the result value isolated by extractMainQuestionResultValue()
 *  and validates it against the constraints defined in the current bill-of-materials
 *  line item.  If there are no constraints it simply returns TRUE.
 *
 * @param currentBomObjective - The current bill-of-materials objective
 *  that is the source of the result value.
 * @param resultAndCharacterNameObj - The character name and result value
 *  extracted by the extractMainQuestionResultValue() function.
 *
 * @returns - Returns a ExtractedResultValueOrErrorResponse that contains either
 *  a valid result value if the result value passed all checks.  Otherwise, it returns
 *  a Content response that should be used as an error response shown to the user
 *  or used by downstream code.
 */
function validateMainQuestionResultValue(currentBomObjective: Objective, resultAndCharacterNameObj: ResultAndCharacterName): ExtractedResultValueOrErrorResponse {
    const errPrefix = `(validateAndExtractMainQuestionResultValue) `;

    elizaLogger.debug(`${errPrefix}Validating main question result value for current bill-of-materials objective: ${currentBomObjective.description}`)

    // NULL is never an acceptable value.
    if (resultAndCharacterNameObj.resultValue === null) {
        throw new Error(`${errPrefix}The resultAndCharacterNameObj parameter's resultValue field is unassigned.`);
    }

    let response: ContentOrNull = null;

    if (currentBomObjective.billOfMaterialsLineItem.type === 'boolean') {
        // -------------------------- BEGIN: EXTRACT BOOLEAN VALUE ------------------------

        if (typeof resultAndCharacterNameObj.resultValue !== 'boolean') {
            // Ask the user to try again.
            response = defaultInvalidResultValueResponse;
        }

        // -------------------------- END  : EXTRACT BOOLEAN VALUE ------------------------
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'number') {
        // -------------------------- BEGIN: EXTRACT NUMERIC VALUE ------------------------

        if (typeof resultAndCharacterNameObj.resultValue !== 'number' || (typeof resultAndCharacterNameObj.resultValue === 'number' && !isFinite(resultAndCharacterNameObj.resultValue))) {
            // Ask the user to try again.
            response = defaultInvalidResultValueResponse;
        } else {
            // Do we have any constraints?
            // Add min/max constraints if present.
            const bIsMinValPresent = typeof currentBomObjective.billOfMaterialsLineItem.minVal === 'number';
            const bIsMaxValPresent = typeof currentBomObjective.billOfMaterialsLineItem.maxVal === 'number';

            if (bIsMaxValPresent && bIsMinValPresent) {
                // >>>>> Minimum AND Maximum values present.  Is the number between these
                //  values?
                if (resultAndCharacterNameObj.resultValue < currentBomObjective.billOfMaterialsLineItem.minVal || resultAndCharacterNameObj.resultValue > currentBomObjective.billOfMaterialsLineItem.maxVal) {
                    response = {
                        text: `Please specify a number between ${currentBomObjective.billOfMaterialsLineItem.minVal} and ${currentBomObjective.billOfMaterialsLineItem.maxVal}`
                    }
                }
            } else if (bIsMinValPresent) {
                // >>>>> ONLY minimum value present.  Is the number greater than or
                //  equal to that value.
                if (resultAndCharacterNameObj.resultValue < currentBomObjective.billOfMaterialsLineItem.minVal) {
                    response = {
                        text: `Please specify a number greater than or equal to ${currentBomObjective.billOfMaterialsLineItem.minVal}`
                    }
                }
            } else if (bIsMaxValPresent) {
                // >>>>> ONLY maximum value present.  Is the number less than or
                //  equal to that value.
                if (resultAndCharacterNameObj.resultValue < currentBomObjective.billOfMaterialsLineItem.maxVal) {
                    response = {
                        text: `Please specify a number less than or equal to ${currentBomObjective.billOfMaterialsLineItem.maxVal}`
                    }
                }
            } else {
                throw new Error(`${errPrefix}Invalid logic pathway encountered during bill-of-materials numeric line item processing.`);
            }
        }

        // -------------------------- END  : EXTRACT NUMERIC VALUE ------------------------
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'string') {
        // -------------------------- BEGIN: EXTRACT STRING VALUE ------------------------

        // TODO: Where is the check to see if it is a list of values bill-of-materials line
        //  item and if so, the check to see if it is one of the valid choices?
        if (typeof resultAndCharacterNameObj.resultValue !== 'string' || (typeof resultAndCharacterNameObj.resultValue === 'string' && resultAndCharacterNameObj.resultValue.trim().length < 1)) {
            // Ask the user to try again.
            response = defaultInvalidResultValueResponse;
        }

        /**
         * IMPORTANT!: We don't validate the result value against the bill-of-materials
         *  objective's list of values field, if that field has a value, because that is
         *  done implicitly in extractMainQuestionResultValue().  In that function, if
         *  the bill-of-materials objective had a list of values field, and the LLM
         *  response text didn't match any of the choices, then this function will not
         *  be called because an error response will have already been generated.
         */
        // -------------------------- END  : EXTRACT STRING VALUE ------------------------
    } else {
        // -------------------------- BEGIN: UNKNOWN TYPE ------------------------

        throw new Error(`${errPrefix}The bill-of-materials line item is of an unknown type: ${currentBomObjective.billOfMaterialsLineItem.type}`);

        // -------------------------- END  : UNKNOWN TYPE ------------------------
    }

    let retExtractedResultValueOrErrorResponse: ExtractedResultValueOrErrorResponse;

    // Did we generate an error response?
    if (response) {
        // Yes. Create a ExtractedResultValueOrErrorResponse to contain it.
        retExtractedResultValueOrErrorResponse = {
            resultAndCharacterNameOrNull: null,
            contentAsErrorResponseOrNull: response,
        }
    } else {
        // No. Then we have a valid numeric result value.  Create a
        //  ExtractedResultValueOrErrorResponse to contain it.
        retExtractedResultValueOrErrorResponse = {
            resultAndCharacterNameOrNull: resultAndCharacterNameObj,
            contentAsErrorResponseOrNull: null
        }
    }

    return retExtractedResultValueOrErrorResponse;
}

/**
 * This function makes an LLM call to have the recent messages
 *  analyzed as part of a bill-of-materials main question,
 *  optional line item or not.
 *
 * @param runtime - The current agent/character.
 * @param state - The current system state for the chat
 * @param currentBomObjective - The current bill-of-materials
 *  objective.
 *
 * @returns - Returns the following based on the context of the result
 *  found or not found in the LLM response to the current bill-of-materials
 *  line item's main question:
 *
 *      - If the LLM response contained a valid result value, then it
 *         will be found in the ExtractedResultValueOrErrorResponse's
 *         resultAndCharacterNameOrNull field.
 *
 *      - If an error response was generated by any of the code executed
 *         in this function, it will be found in the ExtractedResultValueOrErrorResponse's
 *         contentAsErrorResponseOrNull field, which should be shown to the user
 *         or used by subsequent code as an error response.
 */
async function bomMainQuestionCheckResultHandler(
    runtime: IAgentRuntime,
    state: State,
    currentBomObjective: Objective): Promise<ExtractedResultValueOrErrorResponse> {
    const errPrefix = `(bomMainQuestionCheckResultHandler) `;

    // Put the objective's main question into the state before we compose the context.
    mergeBomFieldIntoState(state, "simpleQuestion", currentBomObjective.billOfMaterialsLineItem.prompt);

    // Create text for the LLM that tells it what kind of values to expect
    //  based on the type of bill-of-materials line item the current
    //  objective is for, and the value constraints the line item has,
    //  if any.
    // -------------------------- BEGIN: LLM TEXT FOR EXPECTED RESULT VALUES ------------------------

    let llmExpectedResultValuesText = null;

    if (currentBomObjective.billOfMaterialsLineItem.type === 'boolean') {
        // -------------------------- BEGIN: BOOLEAN TYPE ------------------------

        llmExpectedResultValuesText +=
            `The result value should be a user expression that evaluates to boolean value.  For example, "yes", "sure", "ok", "I want to do that", "Let's do that", "sounds good", etc.  would all resolve to the result value "true".  For example, "nah", "nope", "never", "hell no!", "Forget that", "I don't want to do that", etc. would all resolve to the result value "false".`;

        // -------------------------- END  : BOOLEAN TYPE ------------------------
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'number') {
        // -------------------------- BEGIN: NUMBER TYPE ------------------------

        llmExpectedResultValuesText =
            `The result value should be a numeric value.`;
        // -------------------------- END  : NUMBER TYPE ------------------------
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'string') {
            // -------------------------- BEGIN: STRING TYPE ------------------------

            if (Array.isArray(currentBomObjective.billOfMaterialsLineItem.listOfValidValues) && currentBomObjective.billOfMaterialsLineItem.listOfValidValues.length > 0) {
                const choiceDelimiter = '\n- ';

                // Add list of values.
                const validChoices =
                    currentBomObjective.billOfMaterialsLineItem.listOfValidValues.join(choiceDelimiter);

                llmExpectedResultValuesText =
                    `
                The result value should be equal or similar to one of the following choice values:
                 ${choiceDelimiter}${validChoices}
                 If the user provided result value is one of these values or is closely similar to one of the above values, your response text should be the exact text of the choice value that the user text matches best.
                 `;
            }

            // -------------------------- END  : STRING TYPE ------------------------    } else {
    } else {
        throw new Error(`${errPrefix}Unknown bill-of-materials type: ${currentBomObjective.billOfMaterialsLineItem.type}`);
    }

    // If we created help text of the LLM regarding the expected result values, then
    //  merge the expected values text into the result check message template.
    if (llmExpectedResultValuesText) {
        mergeBomFieldIntoState(state, "resultValueHelp", llmExpectedResultValuesText);
    }

    // -------------------------- END  : LLM TEXT FOR EXPECTED RESULT VALUES ------------------------


    // Do the substitution variable replacements.
    const useFormattedMessage = composeContext({
        state: state,
        template: mainQuestionLLmResultCheckTemplate
    });

    let retExtractedResultValueOrErrorResponse: ExtractedResultValueOrErrorResponse =
        {
            contentAsErrorResponseOrNull: null,
            resultAndCharacterNameOrNull: null
        }

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
    if (typeof category !== 'string' || (typeof category === 'string'  && !isValidMainQuestionResponseCategory(category))) {
        // -------------------------- BEGIN: RETRY PROCESSING ------------------------

        elizaLogger.debug(`${errPrefix}Unable to find a valid main question response category in the LLM output.  Setting response category to RETRY.`);

        // Set the category to RETRY and try asking the user the current
        //  bill-of-materials line item question again.
        category = enumMainQuestionResultCategory.RETRY;
        retExtractedResultValueOrErrorResponse.contentAsErrorResponseOrNull = defaultInvalidResultValueResponse;

        // -------------------------- END  : RETRY PROCESSING ------------------------
    } else {

        category = (category as string).toUpperCase();

        elizaLogger.debug(`${errPrefix}The selected CATEGORY for line item main question is: ${category}\nAssociated text: ${text}\nObjective description: ${currentBomObjective.description}`);

        // -------------------------- BEGIN: CATEGORY BASED UPDATES ------------------------

        if (category === enumMainQuestionResultCategory.CANCEL) {
            // Build a CANCEL response.
            retExtractedResultValueOrErrorResponse.contentAsErrorResponseOrNull =
                buildBomCancelResponse(runtime, errPrefix);
        } else if (category === enumMainQuestionResultCategory.RESULT) {
            // The user gave the LLM a usable result value.  Extract it
            //  from the "text" property returned by the LLM.
            const resultAndCharacterNameObj =
                extractMainQuestionResultValue(currentBomObjective, text);

            retExtractedResultValueOrErrorResponse =
                validateMainQuestionResultValue(currentBomObjective, resultAndCharacterNameObj);
        } else {
            throw new Error(`${errPrefix}Unknown help response category: ${category}`);
        }
    }

    // -------------------------- END  : CATEGORY BASED UPDATES ------------------------

    // We should either have a valid result value or an error response at this point.
    //  If not, then that is an error.
    if (retExtractedResultValueOrErrorResponse.resultAndCharacterNameOrNull === null && retExtractedResultValueOrErrorResponse.contentAsErrorResponseOrNull === null) {
        throw new Error(`${errPrefix}The resultAndCharacterNameOrNull and contentAsErrorResponseOrNull are both unassigned for the current bill-of-materials line item: ${currentBomObjective.description}.`);
    }

    return retExtractedResultValueOrErrorResponse;
}

/**
 * Analyze the recent message stream to see how we should proceed
 *  with the current chat volley.
 *
 *  NOTE: If the current context is the main question for a
 *   bill-of-materials line item, and we were able to isolate a
 *   valid, concrete result, then this function will write the
 *   result into the objective's resultData field and mark it
 *   as completed.
 *
 * @param runtime - The current agent/character.
 * @param roomId - The current room ID.
 * @param userId - The current user ID.
 * @param state - The current system state.
 * @param currentBomObjective - The current bill-of-materials objective.
 *
 * @returns - If an immediate response is required, due to something
 *  like a result value validation failure
 *
 * NOTE: If the current bill-of-materials line item is of type
 *   "string", and it had a list of values constraint attached to
 *   it, and the user made a choice that had an AGENT SWITCH
 *   action associated with it, this function will output a
 *   response that triggers that switch.
 */
export async function determineBomQuestionResult(
        runtime: IAgentRuntime,
        roomId: UUID,
        userId: UUID,
        state: State,
        currentBomObjective: Objective): Promise<Content> {
    const errPrefix = `(determineBomQuestionResult) `;

    if (!isUuid(roomId)) {
        throw new Error(`${errPrefix}The roomId parameter does not contain a valid room ID.`);
    }

    if (!isUuid(userId)) {
        throw new Error(`${errPrefix}The userId parameter does not contain a valid room ID.`);
    }

    if (currentBomObjective === null) {
        throw new Error(`${errPrefix}The currentBomObjective parameter is unassigned.`);
    }

    // First, we need to determine the right message template to use
    //  to give to the LLM, to move the bill-of-materials session
    //  ahead, and then we need to replace the substitution variables
    //  using the current state.s
    // let useFormattedMessage: string | null = null;

    let response: ContentOrNull = null;

    // Do we have a direct response, based on the result checks?
    if (response) {
        // Yes.  Use it as is.
    } else {
        // No.  Validate the current context and if OK, allow
        //  the NULL response to be returned so buildBillOfMaterialQuestion()
        //  can craft a new bill-of-materials question.
        //
        // Is the current bill-of-materials line item optional and does the
        //  preliminary question still need to be asked.?
        if (currentBomObjective.billOfMaterialsLineItem.isOptional && !currentBomObjective.isPreliminaryQuestionAlreadyAsked) {
            // -------------------------- BEGIN: OPTIONAL LINE ITEM ------------------------

            // Yes. Check for a declined optional line item, since those
            //  should not be passed to this function.
            if (currentBomObjective.resultData === null) {
                throw new Error(`${errPrefix}The bill-of-materials line item object is marked as OPTIONAL, yet the objective's resultData is set to NULL, indicating the user declined it.  This objective should never have been passed to buildBillOfMaterialQuestion() in the first place.`);
            }

            // Ask the preliminary question now.
            elizaLogger.debug(`${errPrefix}Asking the preliminary question for bill-of-materials objective: ${currentBomObjective.description}`);

            response =
                await bomPreliminaryQuestionCheckResultHandler(runtime, state, currentBomObjective);

            // Did the user give a valid answer to the preliminary question?
            if (currentBomObjective.isOptionalFieldDesiredByUser === true || currentBomObjective.isOptionalFieldDesiredByUser === false) {
                // Yes.  Mark the optional bill-of-materials line item objective has
                //  having already asked the preliminary question.
                currentBomObjective.isPreliminaryQuestionAlreadyAsked = true;
            }

            // Leave the response null so that buildBillOfMaterialQuestion() is
            //  executed to build the next response.

            // -------------------------- END  : OPTIONAL LINE ITEM ------------------------
        } else {
            // -------------------------- BEGIN: MAIN QUESTION FOR OPTIONAL OR NON-OPTIONAL LINE ITEM ------------------------

            // Do the result checking code for the non-optional main question, which
            //  involves validating the result, if present, against the line item's
            //  value constraint fields, if any, while checking for non-result
            //  oriented items like the HELP and CANCEL intents expressed by the user.
            const retExtractedResultValueOrErrorResponse: ExtractedResultValueOrErrorResponse =
                await bomMainQuestionCheckResultHandler(runtime, state, currentBomObjective);

            if (!retExtractedResultValueOrErrorResponse.contentAsErrorResponseOrNull) {
                // If we don't have an error response, then we MUST have a result value.
                if (!retExtractedResultValueOrErrorResponse.resultAndCharacterNameOrNull) {
                    throw new Error(`${errPrefix}The result and character name field in the extracted result value object is unassigned.`);
                }

                // We now have a concrete result value.  Save it into the
                //  bill-of-materials objective and mark the objective as
                //  completed.
                currentBomObjective.completed = true;
                currentBomObjective.resultData =
                    retExtractedResultValueOrErrorResponse.resultAndCharacterNameOrNull.resultValue;

                // Write an END OBJECTIVE message into the recent messages stream, now that this
                //  bill-of-materials objective is completed.
                await createEndObjectiveMemory(runtime, CLIENT_NAME, roomId, userId);

                // -------------------------- BEGIN: LIST OF VALUES AGENT SWITCH ------------------------

                // If the result and character name object indicates an agent
                //  switch, due to a list of values choice having an agent
                //  switch attached to it, output a response that makes the
                //  switch.
                if (retExtractedResultValueOrErrorResponse.resultAndCharacterNameOrNull.characterName) {
                    const switchAction =
                        `SELECT_CHARACTER_${retExtractedResultValueOrErrorResponse.resultAndCharacterNameOrNull.characterName.toUpperCase().trim()}`;

                    response = {
                        text: `Ok.`,
                        action: switchAction
                    }

                    elizaLogger.debug(`Switching to agent/character("${switchAction}") due to the following list of values choice that had an associated agent/character name: ${response.text}`);

                    // Write an END SESSION message into the recent messages stream.  Switching
                    //  characters implicitly ends the session.
                    await createEndSessionMemory(runtime, CLIENT_NAME, roomId, userId);
                }

                // -------------------------- END  : LIST OF VALUES AGENT SWITCH ------------------------
            }

            // -------------------------- END  : MAIN QUESTION FOR OPTIONAL OR NON-OPTIONAL LINE ITEM ------------------------
        } // else/if (currentBomObjective.billOfMaterialsLineItem.isOptional)
    }

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
export async function buildBomMainQuestion(currentBomObjective: Objective): Promise<string> {
    const errPrefix = `(buildBomMainQuestion) `;

    // We need to adjust the question to encompass any validations
    //  declared in the bill-of-materials line item.
    let retText =
        await processFileUrlOrStringReference(
            'currentBomObjective.billOfMaterialsLineItem.prompt',
            currentBomObjective.billOfMaterialsLineItem.prompt);

    if (currentBomObjective.billOfMaterialsLineItem.type === 'boolean') {
        // -------------------------- BEGIN: BOOLEAN TYPE ------------------------

        // No text modifications needed for boolean questions.

        // -------------------------- END  : BOOLEAN TYPE ------------------------
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'number') {
        // -------------------------- BEGIN: NUMBER TYPE ------------------------

        // Add units if present.
        if (
            typeof currentBomObjective.billOfMaterialsLineItem.unitsDescription === 'string'
                && currentBomObjective.billOfMaterialsLineItem.unitsDescription.trim().length > 0) {
            retText += ` Please give your answer in ${currentBomObjective.billOfMaterialsLineItem.unitsDescription.trim()}.`;
        }

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
    } else if (currentBomObjective.billOfMaterialsLineItem.type === 'string') {
            // -------------------------- BEGIN: STRING TYPE ------------------------

            if (Array.isArray(currentBomObjective.billOfMaterialsLineItem.listOfValidValues) && currentBomObjective.billOfMaterialsLineItem.listOfValidValues.length > 0) {
                // Add list of values if present.
                const validChoices =
                    buildBomOrStringStatement(currentBomObjective.billOfMaterialsLineItem.listOfValidValues);
                retText +=
                    `The available choices are: ${validChoices}`;
            }

            // -------------------------- END  : STRING TYPE ------------------------
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
export async function buildBillOfMaterialQuestion(currentBomObjective: Objective): Promise<StringOrNull> {
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
            piecesOfPrompt.push(currentBomObjective.billOfMaterialsLineItem.preliminaryQuestion);

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
            await buildBomMainQuestion(currentBomObjective);

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

