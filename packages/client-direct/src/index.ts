import bodyParser from "body-parser";
import cors from "cors";
import express, { Request as ExpressRequest } from "express";
import multer, { File } from "multer";
import {
    IAgentRuntimeOrNull,
    buildCharacterNameForRelationship,
    buildFullRelationshipId,
    elizaLogger,
    generateCaption,
    generateImage,
    UUID,
    FullUserIdCharacterIdPair,
    buildRelationshipIdPair,
    BillOfMaterialsLineItem,
    Objective,
    ObjectiveOrNull,
    StringOrNull,
    GoalOrNull,
    State,
    formatMessagesWithStopAtStrings,
    NEW_SESSION_MESSAGE_AS_DELIMITER
} from "@ai16z/eliza";
import { composeContext } from "@ai16z/eliza";
import { generateMessageResponse } from "@ai16z/eliza";
import { messageCompletionFooter } from "@ai16z/eliza";
import { AgentRuntime, Goal } from "@ai16z/eliza";
import {GOAL_NAME_BILL_OF_MATERIALS, resetBomGoalsForRelationship} from "@ai16z/plugin-pilterms";
import {
    Content,
    Memory,
    ModelClass,
    Client,
    IAgentRuntime,
} from "@ai16z/eliza";
import { stringToUuid } from "@ai16z/eliza";
import { settings } from "@ai16z/eliza";
import { createApiRouter } from "./api.ts";
import * as fs from "fs";
import * as path from "path";
import {processFileOrUrlReferences} from "./process-external-references.ts";
const upload = multer({ storage: multer.memoryStorage() });

// -------------------------- BEGIN: UTILITY MESSAGE TEMPLATES ------------------------

/**
 * This is the message template we use to ask the LLM if the user
 *  answered a previously asked preliminary question associated with
 *  an objective that carries a bill-of-materials line item.
 */
const preliminaryQuestionLLmMessageTemplate =
    `
    Your task is to analyze your recent chat interactions with the user and determine if
    they have definitively answered the following question:

    QUESTION: {{simpleQuestion}}

    Here is your recent chat history with the user:

    {{recentMessages}}

    The user's answer will fall into one of the following categories:

    CATEGORY: An answer that equates to boolean true.  For example, "yes", "sure", "Ok", etc.
    CATEGORY: An answer that equates to boolean false.  For example, "no", "not interested", "I don't want to do that", "I don't need that", "Nah", "I'm OK without that" etc.
    CATEGORY: A query about the subject matter the question involves that indicates the user wants more information on the subject.

    Determine the correct_category and then give your answer in JSON format as described here:
    \`\`\`json
    {
        "category": "correct_category"
    }\`\`\`
    `;

/**
 * This is the message template we use to ask the LLM if the user
 *  answered a previously asked main question associated with
 *  an objective that carries a bill-of-materials line item.
 */
const mainQuestionLLmMessageTemplate =
    `
    Your task is to analyze your recent chat interactions with the user and determine if
    they have definitively answered the following question that requested a vital piece
    of information from the user:

    QUESTION: {{simpleQuestion}}

    Here is your recent chat history with the user:

    {{recentMessages}}

    If the user provided a valid answer to the information request, then your answer
    should be that value and just the value, without any surrounding text that isn't
    part of the value, and the category of the answer is "result".

    If the user asked a question about the subject matter the question involves, thus
    indicating the user wants more information on the subject, then your answer
    should be that question and just the question, without any surrounding text that isn't
    related to the question, and the category of the answer is "query".

    If the user indicated that they have changed their mind and are no longer
    interested in the question asked, or want to do something completely different,
    or they want to cancel the current chat,  then your answer be the user's statement,
    and the category of the answer is "abort".

    Determine the category and then give your complete reply in JSON format as described here:
    \`\`\`json
    {
        "category": "Put the category here you selected",
        "result_value": "If the user provided a valid answer put it here, otherwise, put the word null here."
    }\`\`\`
    `;

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

    You need to decide what category of response you are giving the user, using the following rules:

    - If you are continuing to chat with the user to offer them help, the category of your response should be "HELP" and your response text should be the text you want to give to the user.  You should always end your response text with a question asking them if their question has been fully answered.
    - If the user has indicated that their question has been fully answered, the category or your response should be "ANSWERED" and your response text should be {{simpleQuestion}}

    \`\`\`json
    {
        "category": "<put the category that identifies the nature of your response here>",
        "text": "<put your response text to the user here>"
    }\`\`\`
    `;


// -------------------------- END  : UTILITY MESSAGE TEMPLATES ------------------------

// -------------------------- BEGIN: BILL-OF-MATERIALS SUB-PROMPT PROCESSING ------------------------

/**
 * An agent/character is considered a bill-of-materials agent/character
 *  if it is a non-empty array of BillOfMaterialsLineItem objects.
 *
 * @param runtime - The agent/character to inspect.
 *
 * @returns - Returns TRUE if the given agent/character is a bill-of-materials
 *  agent/character, FALSE if not.
 */
function isBomAgentCharacter(runtime: IAgentRuntime): boolean {
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
function validateBillOfMaterialsLineItem(billOfMaterialsLineItem: BillOfMaterialsLineItem): string {
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

        if (typeof billOfMaterialsLineItem.helpTextForOptionalLineItem !== "string"
            || (typeof billOfMaterialsLineItem.helpTextForOptionalLineItem === "string" && billOfMaterialsLineItem.helpTextForOptionalLineItem.length === 0)) {
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
function getNextBomObjective(bomGoal: Goal): ObjectiveOrNull {
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
function buildBomStopAtStringsArray(recentlyAskedQuestion: string): string[] {
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
 * Analyze the recent message stream to see how we should proceed
 *  with the current chat volley.
 *
 * @param state - The current system state.
 * @param currentBomObjective - The current bill-of-materials objective.
 */
async function determineBomQuestionResult(
    state: State,
    currentBomObjective: Objective): Promise<object> {
    const errPrefix = `(determineBomQuestionResult) `;

    if (currentBomObjective === null) {
        throw new Error(`${errPrefix}The currentBomObjective parameter is unassigned.`);
    }

    // Is the objective's bill-of-materials line item object optional?
    if (currentBomObjective.billOfMaterialsLineItem.isOptional) {
        // -------------------------- BEGIN: OPTIONAL LINE ITEM ------------------------

        // Yes. Check for a declined optional line item, since those
        //  should not be passed to this function.
        if (currentBomObjective.resultData === null) {
            throw new Error(`${errPrefix}The bill-of-materials line item object is marked as OPTIONAL, yet the objective's resultData is set to NULL, indicating the user declined it.  This objective should never have been passed to buildBillOfMaterialQuestion() in the first place.`);
        }

        // We should have asked the preliminary question, if not, that's an error.
        const stopAtStrings =
            buildBomStopAtStringsArray(currentBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem);

        // Retrieve the message history up until the preliminary question or
        //  the start of the latest session.
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
            throw new Error(`${errPrefix}The preliminary question not asked, despite there being an open optional bill-of-materials line item.`);
        }

        // Now we ask the LLM to analyze the recent messages history and
        //  tell us if the preliminary question has been answered, or if
        //  we should take a different action (e.g. - answer user's help
        //  question, abort the session at the user's request, etc.).

        // -------------------------- END  : OPTIONAL LINE ITEM ------------------------
    } else {
        // -------------------------- BEGIN: MAIN QUESTION FOR OPTIONAL OR NON-OPTIONAL LINE ITEM ------------------------

        // TODO:???

        // -------------------------- END  : MAIN QUESTION FOR OPTIONAL OR NON-OPTIONAL LINE ITEM ------------------------
    }
}

/**
 * Given an agent/character bill-of-materials goal, use
 *  its bill-of-materials Goal content to create the sub-prompt
 *  for the LLM that facilitates completing the bill-of-materials
 *  objectives.
 *
 * @param nextBomObjective - The current bill-of-materials Objective
 *   object that needs to be processed.
 *
 * @returns - Returns NULL if the goal has no
 *  bill-of-materials content, or if it does, returns the
 *  bill-of-materials sub-prompt made from that content.
 */
function buildBillOfMaterialQuestion(nextBomObjective: Objective): string | null {
    const errPrefix = `(buildBillOfMaterialQuestion) `;

    let retStr: StringOrNull = null;

    const piecesOfPrompt: string[] = [];

    if (nextBomObjective === null) {
        throw new Error(`${errPrefix}The nextBomObjective parameter is unassigned.`)
    }

    // -------------------------- BEGIN: PROCESS NEW OBJECTIVE ------------------------

    let bIsTimeForThePreliminaryQuestion = false;

    // Is the objective's bill-of-materials line item object optional?
    if (nextBomObjective.billOfMaterialsLineItem.isOptional) {
        // Yes. Check for a declined optional line item, since those
        //  should not be passed to this function.
        if (nextBomObjective.resultData === null) {
            throw new Error(`${errPrefix}The bill-of-materials line item object is marked as OPTIONAL, yet the objective's resultData is set to NULL, indicating the user decline interest in it, so it should never have been passed to buildBillOfMaterialQuestion() in the first place.`);
        }

        // If the objective does not have a result yet, then we need to ask the
        //  preliminary question now.
        if (typeof nextBomObjective.resultData === 'undefined') {
            // -------------------------- BEGIN: PRELIMINARY QUESTION FOR OPTIONAL LINE ITEM ------------------------

            // Yes.  Ask the user the question that determines if they are interested
            //  in the optional line item or not.
            piecesOfPrompt.push(nextBomObjective.billOfMaterialsLineItem.preliminaryPromptForOptionalLineItem);

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

        piecesOfPrompt.push(nextBomObjective.billOfMaterialsLineItem.prompt);

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

/**
 * This function checks to see if the given room ID +
 *  user ID combination has been assigned a particular
 *  agent.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the user.
 * @param agentObj - An agent object.
 *
 * @returns - If the given agent is assigned to the
 *  given user in the given room, the IAgentRuntime
 *  object for that agent will be returned.  Otherwise,
 *  null will be returned.
 */
export async function isRelated(roomId: UUID, userId: UUID, agentObj: IAgentRuntime): Promise<IAgentRuntimeOrNull> {
    const characterName =
        agentObj.character.name;

    if (characterName.length > 0) {
        // We build a full user ID from the current room ID
        //  and the current user ID, so the relationship
        //  between the user and the specified character
        //  is local to the current room.  This allows
        //  the user to be serviced by other characters
        //  in other rooms they may be participating in.
        const fullUserId =
            buildFullRelationshipId(roomId, userId);

        // We adorn the character name with a constant prefix
        //  so that we don't accidentally confuse a character
        //  name with a user ID.
        const fullCharacterName =
            buildCharacterNameForRelationship(characterName);

        // Same for the specified character.
        const fullCharacterId =
            buildFullRelationshipId(roomId, fullCharacterName as UUID);

        // Search for a relationship between the user and the selected character.
        //  runtime.databaseAdapter.createRelationship().  ALWAYS put
        // the user before the character!
        const relationshipObjOrNull =
            await agentObj.databaseAdapter.getRelationship(
                {
                    userA: fullUserId,
                    userB: fullCharacterId
                }
            );

        // If a relationship exists, we stop searching
        //  immediately and use the "assigned" agent,
        //  since it has the name of the character that
        //  a request was made to switch to via a
        //  SELECT_CHARACTER_* action occurrence.
        const bIsRelated = relationshipObjOrNull !== null;

        if (bIsRelated)
            return agentObj;
    }

    return null;
}

/**
 * This function searches the agents registry to see if a specific
 *  agent was assigned to the given user in the given room.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the user.
 * @param agentsMap - A map of the available agents.
 */
async function findAgentAssignedToUser(
        roomId: UUID,
        userId: UUID,
        agentsMap: Map<string, AgentRuntime>): Promise<IAgentRuntimeOrNull> {

    // Create an array of Promises for the database asynchronous calls
    const promises: Promise<IAgentRuntimeOrNull>[] = [];

    for (const agentObj of agentsMap.values()) {
        // Push each asynchronous call into the promises array
        promises.push(
            isRelated(roomId, userId, agentObj)
        );
    }

    const results = await Promise.all(promises);

    // Take the first agent assigned, if any assignments exist,
    //  and return it.  Or return NULL if no assignment exists.
    let agentFoundOrNull: IAgentRuntimeOrNull = null;

    // Find the first result that is an AgentRuntime object
    agentFoundOrNull =
        results.find(
            (result: IAgentRuntimeOrNull): result is AgentRuntime => result !== null) || null;

    return agentFoundOrNull;
}


export class DirectClient {
    public app: express.Application;
    private agents: Map<string, AgentRuntime>;
    private server: any; // Store server instance

    constructor() {
        elizaLogger.log("DirectClient constructor");
        this.app = express();
        this.app.use(cors());
        this.agents = new Map();

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        const apiRouter = createApiRouter(this.agents);
        this.app.use(apiRouter);

        // Define an interface that extends the Express Request interface
        interface CustomRequest extends ExpressRequest {
            file: File;
        }

        // Update the route handler to use CustomRequest instead of express.Request
        this.app.post(
            "/:agentId/whisper",
            upload.single("file"),
            async (req: CustomRequest, res: express.Response) => {
                const audioFile = req.file; // Access the uploaded file using req.file
                const agentId = req.params.agentId;

                if (!audioFile) {
                    res.status(400).send("No audio file provided");
                    return;
                }

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const formData = new FormData();
                const audioBlob = new Blob([audioFile.buffer], {
                    type: audioFile.mimetype,
                });
                formData.append("file", audioBlob, audioFile.originalname);
                formData.append("model", "whisper-1");

                const response = await fetch(
                    "https://api.openai.com/v1/audio/transcriptions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${runtime.token}`,
                        },
                        body: formData,
                    }
                );

                const data = await response.json();
                res.json(data);
            }
        );

        this.app.post(
            "/:agentId/message",
            async (req: express.Request, res: express.Response) => {

                /**
                 * Check for the existence of a main bill-of-materials goal for
                 *  the current relationship.
                 *
                 *  @param relationshipIdPair - The room ID prepended full user ID
                 *   and agent/character ID that forms the relationship.
                 *
                 *  @returns - Returns the active bill-of-materials goal for the
                 *   current relationship if one exists, NULL if not.
                 */
                async function checkForMainBomGoal(relationshipIdPair: FullUserIdCharacterIdPair): Promise<GoalOrNull> {
                    const errPrefix = '(checkForMainBomGoal) ';

                    let retGoalOrNull: GoalOrNull = null;

                    if (relationshipIdPair.fullUserId.length === 0)
                        throw new Error(`${errPrefix} The full user ID is empty.`);
                    if (relationshipIdPair.fullCharacterId.length === 0)
                        throw new Error(`${errPrefix} The full character ID is empty.`);

                    // Find all the bill-of-materials goals belonging to this
                    //  user to agent/character relationship.
                    const bomGoalsFound =
                        await runtime.databaseAdapter.getGoalsByRelationship(
                            {
                                agentId: relationshipIdPair.fullCharacterId,
                                userId: relationshipIdPair.fullUserId,
                                name: GOAL_NAME_BILL_OF_MATERIALS
                            }
                        );

                    if (!Array.isArray(bomGoalsFound))
                        throw new Error(`The return from getGoalsByRelationship was not an array.`);

                    // We should only have 1 main goal for a particular agent/character
                    //  name.  If there is more than 1 then, the ensuing results
                    //  are unpredictable.
                    if (bomGoalsFound.length > 1)
                        throw new Error(`More than one goal was returned from getGoalsByRelationship.  Only one or none is expected.`);

                    if (bomGoalsFound.length > 0) {
                        elizaLogger.debug(`An existing goal was found for agent/character: ${runtime.character.name}`);

                        // Use the existing goal.
                        retGoalOrNull = bomGoalsFound[0];
                    } else {
                        elizaLogger.debug(`No existing goals found for agent/character: ${runtime.character.name}`);
                    }

                    return retGoalOrNull;
                }  // checkForMainBomGoal()

                const agentId = req.params.agentId;
                const roomId = stringToUuid(
                    req.body.roomId ?? "default-room-" + agentId
                );
                const userId = stringToUuid(req.body.userId ?? "user");
                const userInput = req.body.text.trim();

                // TODO: Until we create a more sophisticated way to reset a session
                //  with a user to the "start" condition, we look for a simple "reset"
                //  statement to do this.  If found then we do not override the
                //  the default choice which in the direct client, is the first
                //  available agent.
                const bIsResetCommand = userInput === 'reset';

                let mainBomGoal: Goal | null = null;

                if (bIsResetCommand)
                    elizaLogger.debug(`Direct client message route received a RESET instruction.`);

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    const infoMsg = `Unable to find an agent with ID: ${agentId}`;

                    elizaLogger.debug(infoMsg);

                    res.status(404).send(infoMsg);
                    return;
                }

                // -------------------------- BEGIN: CHARACTER/AGENT SWITCH HANDLING ------------------------

                // Iterate the available agents to see if any of them
                //  have a relationship with the current user in the
                //  current room.  If they do, override the default
                //  agent/character choice with the one in the
                //  relationship with the user in the current room.
                const overrideRuntimeOrNull =
                    await findAgentAssignedToUser(roomId, userId, this.agents);

                if (overrideRuntimeOrNull instanceof AgentRuntime) {
                    elizaLogger.debug(`User assigned the following agent with CHARACTER name: ${overrideRuntimeOrNull.character.name}`);

                    // Override the selected agent.
                    runtime = overrideRuntimeOrNull;
                }

                // Make sure we have a valid agent/character to use from here one.
                if (!runtime) {
                    throw new Error(`The "runtime" agent/character variable is unassigned.`);
                }

                // -------------------------- BEGIN: HOT-LOAD CHARACTER CONTENT ------------------------

                // This code process all the character fields that have "file:", "http:", or "https:"
                //  prefixes and replaces the field content with the results of a file load or
                //  HTTP/HTTPS fetch call.
                await processFileOrUrlReferences(runtime.character);

                // -------------------------- END  : HOT-LOAD CHARACTER CONTENT ------------------------

                // >>>>> Is this a bill-of-materials agent/character or not?
                const bIsBomAgentCharacter =
                    isBomAgentCharacter(runtime);

                if (bIsBomAgentCharacter) {

                    const relationshipIdPair: FullUserIdCharacterIdPair =
                        buildRelationshipIdPair(roomId, userId, runtime.character.name);

                    // If this is not an explicit RESET command, then see if the
                    //  current agent/character has a goal in progress.
                    if (!bIsResetCommand) {
                        // -------------------------- BEGIN: CHECK FOR EXISTING BOM GOAL FOR AGENT/CHARACTER ------------------------

                        mainBomGoal =
                            await checkForMainBomGoal(relationshipIdPair);

                        // -------------------------- END  : CHECK FOR EXISTING BOM GOAL FOR AGENT/CHARACTER ------------------------
                    }

                    // Was an explicit RESET command triggered OR does the agent/character
                    //  not have an existing goal object?
                    if (bIsResetCommand || !mainBomGoal) {
                        elizaLogger.debug(`RESET command received.  Building the main bill-of-materials goal for agent/character: ${runtime.character.name}.`);

                        // Yes. Rebuild the character/agent's MAIN goal using its
                        //  bill of materials content.
                        mainBomGoal = await resetBomGoalsForRelationship(roomId, userId, runtime);
                    } else {
                        // No. mainBomGoal should have a valid bill-of-materials goal for
                        //  us to use now.
                        elizaLogger.debug(`Re-using the main bill-of-materials goal for agent/character: ${runtime.character.name}.`);
                    }
                }

                // -------------------------- END  : CHARACTER/AGENT SWITCH HANDLING ------------------------

                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

                // -------------------------- BEGIN: SAVE USER INPUT AS MEMORY ------------------------

                const text = req.body.text;
                const messageId = stringToUuid(Date.now().toString());

                const content: Content = {
                    text,
                    attachments: [],
                    source: "direct",
                    inReplyTo: undefined,
                };

                const userMessage = {
                    content,
                    userId,
                    roomId,
                    agentId: runtime.agentId,
                };

                const memory: Memory = {
                    id: messageId,
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content,
                    createdAt: Date.now(),
                };

                await runtime.messageManager.createMemory(memory);

                // -------------------------- END  : SAVE USER INPUT AS MEMORY ------------------------

                const state = await runtime.composeState(userMessage, {
                    agentName: runtime.character.name,
                });


                // TODO: If there is a bill-of-materials goal active for the current
                //  agent/character, then now it is time to facilitate that objective
                //  by creating the bill-of-materials sub-prompt for insertion into
                //  the message handler template.

                let response: Content | null = null;

                if (mainBomGoal) {
                    // Determine the next objective that needs to be completed.
                    const currentBomObjective = getNextBomObjective(mainBomGoal);

                    if (currentBomObjective === null) {
                        // -------------------------- BEGIN: BILL-OF-MATERIALS GOAL COMPLETE ------------------------

                        // If we don't have an agent/character to switch control to,
                        //  now that the bill-of-materials goal is complete, then that
                        //  is an error.
                        const nextCharacterName =
                            runtime.character.switchToCharacterWhenBomComplete;

                        if (typeof nextCharacterName !== "string" || typeof nextCharacterName === "string" && nextCharacterName.trim().length === 0) {
                            throw new Error(`The bill-of-materials goal processing is complete, but the character does not specify the next agent to transfer control to (i.e. - switchToCharacterWhenBomComplete is unassigned or invalid.`);
                        }

                        // Emit the action that will transfer control of the conversation
                        //  to the next agent/character.
                        response = {
                            text: `Transferring you over to the next agent: ${nextCharacterName}`,
                            action: `SELECT_CHARACTER_${nextCharacterName}`
                        }

                        // -------------------------- END  : BILL-OF-MATERIALS GOAL COMPLETE ------------------------

                    } else {
                        // -------------------------- BEGIN: PROCESS CURRENT BILL-OF-MATERIALS OBJECTIVE ------------------------

                        // First, we need to check for an answer to a recently
                        //  asked optional line item preliminary question,
                        //  optional line item main question, or non-optional
                        //  line item main question.
                        await determineBomQuestionResult(state, currentBomObjective);

                        // Determine what question we should ask the user now.
                        const billOfMaterialsQuestion =
                            buildBillOfMaterialQuestion(currentBomObjective);

                        if (billOfMaterialsQuestion.trim().length === 0)
                            throw new Error(`The billOfMaterialsQuestion variable is empty.`);

                        // Create a response that will ask the user the desired question.
                        response = {
                            text: billOfMaterialsQuestion
                        }

                        // -------------------------- END  : PROCESS CURRENT BILL-OF-MATERIALS OBJECTIVE ------------------------
                    }
                } else {
                    // -------------------------- BEGIN: LEGACY PROCESSING (Not bill-of-materials) ------------------------

                    // If the character has its own message template, use that instead.
                    let useTemplate = messageHandlerTemplate;

                    if (runtime.character.messageTemplate && runtime.character.messageTemplate.trim().length > 0) {
                        elizaLogger.debug(`OVERRIDING message template with CHARACTER defined message template.`);
                        useTemplate = runtime.character.messageTemplate.trim();
                    }

                    const context = composeContext({
                        state,
                        template: useTemplate,
                    });

                    // Now, make the call to the LLM using the updated context.
                    //
                    // DEV NOTE: "context" is just a string with the substitution
                    //  variables filled in by the composeContext() call using
                    //  elements found in the "state" variable.
                    //
                    //  The "runtime" (agent/character) object is passed in to
                    //  give the code that sets up the LLM call access to the
                    //  settings and environment variables the agent/character
                    //  object carries, and access to the agent/character's
                    //  system prompt (i.e. - runtime.character.system_prompt),
                    //  which has priority ver the SYSTEM_PROMPT environment
                    //  variable.  Note, either or both of these two system
                    //  prompt sources may be unassigned.
                    //
                    //  See aiGenerateText in generations.ts (eliza package) for
                    //  details.
                    response = await generateMessageResponse({
                        runtime: runtime,
                        context,
                        modelClass: ModelClass.SMALL,
                    });

                    // -------------------------- END  : LEGACY PROCESSING (Not bill-of-materials) ------------------------
                }

                // save response to memory
                const responseMessage = {
                    ...userMessage,
                    userId: runtime.agentId,
                    content: response,
                };

                await runtime.messageManager.createMemory(responseMessage);

                if (!response) {
                    res.status(500).send(
                        "No response from generateMessageResponse"
                    );
                    return;
                }

                let message = null as Content | null;

                await runtime.evaluate(memory, state);

                const _result = await runtime.processActions(
                    memory,
                    [responseMessage],
                    state,
                    async (newMessages) => {
                        message = newMessages;
                        return [memory];
                    }
                );

                if (message) {
                    res.json([response, message]);
                } else {
                    res.json([response]);
                }
            }
        );

        this.app.post(
            "/:agentId/image",
            async (req: express.Request, res: express.Response) => {
                const agentId = req.params.agentId;
                const agent = this.agents.get(agentId);
                if (!agent) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const images = await generateImage({ ...req.body }, agent);
                const imagesRes: { image: string; caption: string }[] = [];
                if (images.data && images.data.length > 0) {
                    for (let i = 0; i < images.data.length; i++) {
                        const caption = await generateCaption(
                            { imageUrl: images.data[i] },
                            agent
                        );
                        imagesRes.push({
                            image: images.data[i],
                            caption: caption.title,
                        });
                    }
                }
                res.json({ images: imagesRes });
            }
        );

        this.app.post(
            "/fine-tune",
            async (req: express.Request, res: express.Response) => {
                try {
                    const response = await fetch(
                        "https://api.bageldb.ai/api/v1/asset",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                            body: JSON.stringify(req.body),
                        }
                    );

                    const data = await response.json();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({
                        error: "Please create an account at bakery.bagel.net and get an API key. Then set the BAGEL_API_KEY environment variable.",
                        details: error.message,
                    });
                }
            }
        );
        this.app.get(
            "/fine-tune/:assetId",
            async (req: express.Request, res: express.Response) => {
                const assetId = req.params.assetId;
                const downloadDir = path.join(
                    process.cwd(),
                    "downloads",
                    assetId
                );

                console.log("Download directory:", downloadDir);

                try {
                    console.log("Creating directory...");
                    await fs.promises.mkdir(downloadDir, { recursive: true });

                    console.log("Fetching file...");
                    const fileResponse = await fetch(
                        `https://api.bageldb.ai/api/v1/asset/${assetId}/download`,
                        {
                            headers: {
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                        }
                    );

                    if (!fileResponse.ok) {
                        throw new Error(
                            `API responded with status ${fileResponse.status}: ${await fileResponse.text()}`
                        );
                    }

                    console.log("Response headers:", fileResponse.headers);

                    const fileName =
                        fileResponse.headers
                            .get("content-disposition")
                            ?.split("filename=")[1]
                            ?.replace(/"/g, "") || "default_name.txt";

                    console.log("Saving as:", fileName);

                    const arrayBuffer = await fileResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    const filePath = path.join(downloadDir, fileName);
                    console.log("Full file path:", filePath);

                    await fs.promises.writeFile(filePath, buffer);

                    // Verify file was written
                    const stats = await fs.promises.stat(filePath);
                    console.log(
                        "File written successfully. Size:",
                        stats.size,
                        "bytes"
                    );

                    res.json({
                        success: true,
                        message: "Single file downloaded successfully",
                        downloadPath: downloadDir,
                        fileCount: 1,
                        fileName: fileName,
                        fileSize: stats.size,
                    });
                } catch (error) {
                    console.error("Detailed error:", error);
                    res.status(500).json({
                        error: "Failed to download files from BagelDB",
                        details: error.message,
                        stack: error.stack,
                    });
                }
            }
        );
    }

    public registerAgent(runtime: AgentRuntime) {
        this.agents.set(runtime.agentId, runtime);
    }

    public unregisterAgent(runtime: AgentRuntime) {
        this.agents.delete(runtime.agentId);
    }

    public start(port: number) {
        this.server = this.app.listen(port, () => {
            elizaLogger.success(`Server running at http://localhost:${port}/`);
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            elizaLogger.log("Received shutdown signal, closing server...");
            this.server.close(() => {
                elizaLogger.success("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                elizaLogger.error(
                    "Could not close connections in time, forcefully shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public stop() {
        if (this.server) {
            this.server.close(() => {
                elizaLogger.success("Server stopped");
            });
        }
    }
}

export const DirectClientInterface: Client = {
    start: async (_runtime: IAgentRuntime) => {
        elizaLogger.log("DirectClientInterface start");
        const client = new DirectClient();
        const serverPort = parseInt(settings.SERVER_PORT || "3000");
        client.start(serverPort);
        return client;
    },
    stop: async (_runtime: IAgentRuntime, client?: any) => {
        if (client instanceof DirectClient) {
            client.stop();
        }
    },
};

export default DirectClientInterface;
