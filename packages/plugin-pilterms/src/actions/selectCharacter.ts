import {
    elizaLogger,
    type Goal,
    type Objective,
    GoalStatus,
    HandlerCallback,
    type IAgentRuntime,
    type Memory,
    setExclusiveUserToCharacterRelationship,
    type State,
    UUID, buildRelationshipIdPair,
} from "@ai16z/eliza";
import {pickLicenseTemplate} from "../templates";
import {ActorActionDetails} from "../system/types.ts";
import {isRelated} from "@ai16z/client-direct";
import {v4} from "uuid";

// This is the name we assign to goals that are part of the bill-of-materials
//  system.
export const GOAL_NAME_BILL_OF_MATERIALS = 'bill of materials';
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
export function findUserIdInState(state: State, ignoreUserNames: string[] = ["PickLicense"]): UuidOrNull {
    // Validate input
    if (!state || !Array.isArray(state.actorsData)) {
        throw new Error("The 'state' parameter must be an object with an 'actorsData' array.");
    }

    // Find the first actor whose name is not in the ignore list
    const matchingActor = state.actorsData.find(actor => !ignoreUserNames.includes(actor.name));

    // Return the actor's ID if found, otherwise return null
    return matchingActor ? matchingActor.id : null;
}

/**
 * This function removes all the goals for the specified agent/characters
 *  that exist in the given room, and recreates the MAIN goal from the
 *  agent/character's bill of materials line items.
 *
 * @param roomId - The ID of the target room.
 * @param userId - The user the agent/character is chatting with.
 * @param runtime - The current agent/character.
 *
 * @returns - Returns the newly created Goal object created during
 *  the reset operation.
 */
export async function resetBomGoalsForRelationship(roomId: UUID, userId: UUID, runtime: IAgentRuntime): Promise<Goal> {
    elizaLogger.debug(`RESETTING main GOAL and objectives using bill of materials content for agent/character: ${runtime.character.name}`);

    // Build a room ID prepended relationship ID pair object.
    const relationshipIdPair = buildRelationshipIdPair(roomId, userId, runtime.character.name);

    // Delete all existing bill-of-materials goals for the
    //  user ID + agent ID pair that have a relationship in
    //  the same room.  Note, theroom ID is prepended to
    //  create the full IDs, so we don't need to add the room ID
    //  as a parameter.
    await runtime.databaseAdapter.removeGoalsByRelationship(
        {
            agentId: relationshipIdPair.fullCharacterId,
            userId: relationshipIdPair.fullUserId,
            name: GOAL_NAME_BILL_OF_MATERIALS,
            // goalStatus: "IN_PROGRESS" // "IN_PROGRESS" | "DONE" | "FAILED"
        }
    );

    // Recreate the main goal for this agent/character
    //  with its objectives using the bill-of-materials line item
    //  fields.
    const objectivesForAgent: Objective[] =
        await billOfMaterialsToObjectives(runtime);

    // Create the objectives for the goal from the agent/character's
    //  bill-of-materials information.
    const newGoal: Goal =
        {
            agentId: relationshipIdPair.fullCharacterId,
            userId: relationshipIdPair.fullCharacterId,
            roomId: roomId,
            name: `bill-of-materials`,
            id: v4() as UUID,
            objectives: objectivesForAgent,
            status: GoalStatus.IN_PROGRESS,
        }

    // Store the goal.
    await runtime.databaseAdapter.createGoal(newGoal);

    elizaLogger.debug(`MAIN GOAL and objectives rebuilt using the bill of materials content for agent/character: ${runtime.character.name}`);

    return newGoal;
}

// -------------------------- BEGIN: ACTION NAMES for CHARACTERS ------------------------

const ACTION_NAME_SELECT_CHARACTER_ANY = "SELECT_CHARACTER_CHARACTER_NAME";

// -------------------------- END  : ACTION NAMES for CHARACTERS ------------------------

// section_

/**
 * Type representing a string or null.
 */
type StringOrNull = string | null;

/**
 * Type representing a string or null.
 */
type UuidOrNull = UUID | null;

// -------------------------- BEGIN: HELPER FUNCTIONS ------------------------

// -------------------------- END  : HELPER FUNCTIONS ------------------------

// -------------------- BEGIN: ACTION, SELECT CHARACTER ------------

/**
 * This function creates the array of objectives for an agent/character from
 *  its bill-of-materials information (if any).
 *
 * @param runtime - The agent/character to build objectives for.
 *
 * @returns - Returns an array of objectives based on the bill-of-materials
 *  content found in the agent/character.  If the agent/character has
 *  no bill-of-materials content, an empty array is returned.
 */
export async function billOfMaterialsToObjectives(runtime: IAgentRuntime): Promise<Objective[]> {
    const bomObjectivesForAgent = [];

    if (runtime.character.billOfMaterials && runtime.character.billOfMaterials.length > 0) {
        // Iterate the bill of materials array to create the objectives.
        for (let bomNdx = 0; bomNdx < runtime.character.billOfMaterials.length; bomNdx++) {
            const bomLineItem = runtime.character.billOfMaterials[bomNdx];

            const newObjective: Objective = {
                // Transfer over the full bill of materials line item
                //  content, for use by the system when it creates/modifies
                //  the LLM prompt.
                billOfMaterialsLineItem:  bomLineItem,
                // Use the bill of materials line item name for the description.
                description: bomLineItem.name,
                isInHelpMode: false,
                id: v4(),
                completed: false,
            }

            bomObjectivesForAgent.push(newObjective);
        }
    }

    return bomObjectivesForAgent;
}

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
                    elizaLogger.debug(`ACTIVE CHARACTER (continuing): ${runtime.character.name}`);
                } else {
                    // -------------------------- BEGIN: CREATE NEW USER/CHARACTER RELATIONSHIP ------------------------

                    elizaLogger.debug(`ACTIVE CHARACTER (changing to): ${runtime.character.name}`);

                    // Make an exclusive relationship between the given user ID and the
                    //  selected agent/character.  All other relationships for that user
                    //  in the current room will be broken.
                    await setExclusiveUserToCharacterRelationship(roomId, userId, runtime);

                    // Does the character have the resetGoalsOnReceivingControl flag
                    //  set?
                    if (runtime.character.resetGoalsOnReceivingControl) {
                        await resetBomGoalsForRelationship(roomId, userId, runtime);
                    }

                    //  TODO: Need to do this from the "reset" command code too! (See
                    //  bIsResetCommand).

                    // THEN: Modify the LLM prompt based on the needs of the agent/character's
                    //  current goal(s).

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

