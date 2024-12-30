import {
    composeContext,
    elizaLogger,
    generateObjectDEPRECATED,
    HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
    generateText,
    buildFullRelationshipId,
    buildCharacterNameForRelationship,
    removeAllUserToCharacterRelationships, setExclusiveUserToCharacterRelationship,
} from "@ai16z/eliza";
import {
    isRelated
} from "@ai16z/client-direct";
import { pickLicenseTemplate } from "../templates";
import {ActorActionDetails} from "../system/types.ts";

export { pickLicenseTemplate };

const bVerbose = true;


/**
 * Finds the first actor in the state's `actorsData` array whose name is
 *  not in the `ignoreUserNames` list and returns their `id` field. If no
 *  such actor is found, returns `null`.
 *
 * @param state - The state object containing the `actorsData` array.
 * @param ignoreUserNames - An array of names to ignore during the
 *  search. Defaults to `["PickLicense"]`.
 *
 * @returns The `id` of the first matching actor or `null` if no match
 *  is found.
 */
export function findUserIdInState(state: State, ignoreUserNames: string[] = ["PickLicense"]): StringOrNull {
    // Validate input
    if (!state || !Array.isArray(state.actorsData)) {
        throw new Error("The 'state' parameter must be an object with an 'actorsData' array.");
    }

    // Find the first actor whose name is not in the ignore list
    const matchingActor = state.actorsData.find(actor => !ignoreUserNames.includes(actor.name));

    // Return the actor's ID if found, otherwise return null
    return matchingActor ? matchingActor.id : null;
}

// -------------------------- BEGIN: ACTION NAMES for CHARACTERS ------------------------

const ACTION_NAME_SELECT_CHARACTER_ANY = "SELECT_CHARACTER_CHARACTER_NAME";

// -------------------------- END  : ACTION NAMES for CHARACTERS ------------------------

// section_

/**
 * Type representing a string or null.
 */
type StringOrNull = string | null;

// -------------------------- BEGIN: HELPER FUNCTIONS ------------------------

// -------------------------- END  : HELPER FUNCTIONS ------------------------

// -------------------- BEGIN: ACTION, SELECT CHARACTER ------------

/**
 * This action creates a relationship between the current
 *  room ID + user ID pair, and the current room ID + active character ID,
 *  so that the client knows to what agent/character the next chat volley
 *  should be routed to.
 */
export const selectCharacterAction = {
    name: ACTION_NAME_SELECT_CHARACTER_ANY,
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

        let characterName = "";

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
                ActorActionDetails.extractRecentActorAction(state);

            if (lastActorActionDetailsObj) {
                characterName = lastActorActionDetailsObj.nameOfDesiredCharacter;

                if (bVerbose) {
                    elizaLogger.log(`${errPrefix}Setting ACTIVE CHARACTER to character named: ${characterName}`);
                }

                const roomId = state.roomId;

                // Find the user ID in the current "state"'s actors
                //  array.
                const userId = findUserIdInState(state);

                // Is there an existing relationship between the current user and
                //  the currently set agent/character in the current room?
                const bIsAlreadyRelated =
                    await isRelated(roomId, userId, runtime);

                if (bIsAlreadyRelated) {

                } else {
                    // -------------------------- BEGIN: CREATE NEW USER/CHARACTER RELATIONSHIP ------------------------

                    // Make an exclusive relationship between the given user ID and the
                    //  selected agent/character.  All other relationships for that user
                    //  in the current room will be broken.
                    await setExclusiveUserToCharacterRelationship(roomId, userId, runtime);

                    // -------------------------- END  : CREATE NEW USER/CHARACTER RELATIONSHIP ------------------------
                }
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
    // REMEMBER: Put the names of all the characters your app uses here,
    //  in SELECT_CHARACTER_<name> format!  The <name> value MUST
    //  be the name found in the "name:" field found in the
    //  character JSON file.  This allows the select character action to
    //  be triggered whenever an LLM emits a SELECT_CHARACTER_* action.
    similes: ["SELECT_CHARACTER_SPSTART", "SELECT_CHARACTER_SPPICKLICENSE", "SELECT_CHARACTER_SPHANDLELICENSE"],
};


// -------------------- END  : ACTION, SELECT CHARACTER ------------

