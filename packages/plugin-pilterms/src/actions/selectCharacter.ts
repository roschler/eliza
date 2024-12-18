import {
    composeContext,
    elizaLogger,
    generateObjectDEPRECATED,
    HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State, generateText,
} from "@ai16z/eliza";
import { pickLicenseTemplate } from "../templates";
import {ActorActionDetails} from "../system/types.ts";

export { pickLicenseTemplate };

const bVerbose = true;

// -------------------------- BEGIN: ACTION NAMES for CHARACTERS ------------------------

// Update this list of constants when the names of characters
//  used changes.  Remember to update the action name and
//  similes properties appropriately!

const ACTION_NAME_SELECT_CHARACTER_SPPICKLICENSE = "SELECT_CHARACTER_SPPICKLICENSE";
const ACTION_NAME_SELECT_CHARACTER_TATE = "SELECT_CHARACTER_TATE";
const ACTION_NAME_SELECT_CHARACTER_TRUMP = "SELECT_CHARACTER_TRUMP";

// -------------------------- END  : ACTION NAMES for CHARACTERS ------------------------

// section_

/**
 * Type representing a string or null.
 */
type StringOrNull = string | null;

// -------------------------- BEGIN: HELPER FUNCTIONS ------------------------

/**
 * Given a State object, extract, if any, the name found in the
 *  last request to select a new character.  Note, the request
 *  MUST be found in the most recent message. (i.e. - The most
 *  recent message that carries the "(just now)" time prefix).
 *
 * @param state - The state variable that contains the message
 *  data we will inspect.
 *
 * @returns - Returns NULL if a most recent select character action
 *  could not be found.  Otherwise, the name of the character
 *  found in that command is returned, lowercase.
 */
function extractLastSelectCharacterActionName(state: State): StringOrNull
{
    // Get the most recent select character details.
    const x = ActorActionDetails.extractRecentActorAction(state.recentMessages);

    if (!x)
        // None found.
        return null;

    // Get the name of the character to switch to.
    const targetCharacterNameLowercase =
        ActorActionDetails.extractLastSelectCharacterActionName()

}

// -------------------------- END  : HELPER FUNCTIONS ------------------------

// -------------------- BEGIN: ACTION, SELECT CHARACTER ------------

/**
 * This action is the top level dialog control action.  It
 *  decides what context is the active context where to route
 *  control based on the decided context.
 */
export const selectCharacterAction = {
    name: ACTION_NAME_SELECT_CHARACTER_SPPICKLICENSE,
    description: "Watches for SELECT CHARACTER actions and updates the current context so that the current client can change the active character to the selected one.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const errPrefix = `(selectCharacterAction::handler) `;

        elizaLogger.log(`Starting SELECT CHARACTER handler...`);

        let characterName = "":

        try {
            // initialize or update state
            if (!state) {
                // Remember, calling composeState() is computationally
                //  expensive!
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Extract the specified character name from the most recent message
            //  from the pickLicense actor.
            const lastActorActionDetailsObj =
                ActorActionDetails.extractRecentActorAction(state.recentMessages);

            if (lastActorActionDetailsObj) {
                characterName = lastActorActionDetailsObj.targetCharacterName;
            }

            if (bVerbose) {
                elizaLogger.log(`${errPrefix}Setting ACTIVE CHARACTER to character named: ${characterName}`);
            }

            // Test Story Protocol plugin
            callback?.({
                text: `${errPrefix}ACTIVE CHARACTER set to character name: ${characterName}`,
                action: "CONTINUE"
            });
            return true;
        } catch (e) {
            const errMsg =
                `${errPrefix}Error executing selectCharacterAction handler: ${e.message}`;

            elizaLogger.error(errMsg);
            callback?.({ text: errMsg });
            return false;
        }
    },
    // template: pickLicenseTemplate,
    validate: async (runtime: IAgentRuntime) => {
        // const privateKey = runtime.getSetting("STORY_PRIVATE_KEY");
        // return typeof privateKey === "string" && privateKey.startsWith("0x");

        // TODO: Add the correct validation logic.
        return true;
    },
    // No examples needed.
    examples: [],
    // Put the other SELECT ACTION constants here.
    similes: [ACTION_NAME_SELECT_CHARACTER_TATE, ACTION_NAME_SELECT_CHARACTER_TRUMP],
};


// -------------------- END  : ACTION, SELECT CHARACTER ------------

