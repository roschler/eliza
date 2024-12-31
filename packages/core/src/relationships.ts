import {FullUserIdCharacterIdPair, IAgentRuntime, type Relationship, type UUID} from "./types.ts";
import elizaLogger from "./logger.ts";

export async function createRelationship({
    runtime,
    userA,
    userB,
}: {
    runtime: IAgentRuntime;
    userA: UUID;
    userB: UUID;
}): Promise<boolean> {
    return runtime.databaseAdapter.createRelationship({
        userA,
        userB,
    });
}

export async function getRelationship({
    runtime,
    userA,
    userB,
}: {
    runtime: IAgentRuntime;
    userA: UUID;
    userB: UUID;
}) {
    return runtime.databaseAdapter.getRelationship({
        userA,
        userB,
    });
}

export async function getRelationships({
    runtime,
    userId,
}: {
    runtime: IAgentRuntime;
    userId: UUID;
}) {
    return runtime.databaseAdapter.getRelationships({ userId });
}

export async function formatRelationships({
    runtime,
    userId,
}: {
    runtime: IAgentRuntime;
    userId: UUID;
}) {
    const relationships = await getRelationships({ runtime, userId });

    const formattedRelationships = relationships.map(
        (relationship: Relationship) => {
            const { userA, userB } = relationship;

            if (userA === userId) {
                return userB;
            }

            return userA;
        }
    );

    return formattedRelationships;
}

// -------------------------- BEGIN: RELATIONSHIPS ------------------------

/**
 * Builds a standardized character name for a relationship.  The character
 *  names are the names found as the first string in a dotted string
 *  name that forms a character JSON primary file name.
 *
 * @param characterName - The name of the character. Must be a non-empty
 *  string after trimming.
 *
 * @returns A string in the format: `character::<trimmedCharacterName>`.
 *
 * @throws {Error} If:
 * - `characterName` is empty after trimming.
 */
export function buildCharacterNameForRelationship(characterName: string): string {
    // Trim the input
    const trimmedCharacterName = characterName.trim();

    /**
     * Validate that `characterName` is a non-empty string after trimming.
     */
    if (!trimmedCharacterName) {
        throw new Error("The 'characterName' parameter must be a non-empty string after trimming.");
    }

    /**
     * Construct the full character name for the relationship in the format: `character::<trimmedCharacterName>`.
     */
    const fullCharacterNameForRelationship = `character->${trimmedCharacterName}`;
    return fullCharacterNameForRelationship;
}

/**
 * Builds a full relationship ID by combining a room ID and a user ID.
 *
 * @param roomId - The ID of the room. Must be a non-empty string after trimming.
 * @param userId - The ID of the user. Must be a non-empty string after trimming.
 *
 * @returns A string in the format: `<trimmedRoomId>::<trimmedUserId>`.
 *
 * @throws {Error} If:
 * - `roomId` is empty after trimming.
 * - `userId` is empty after trimming.
 * - `roomId` and `userId` have the same value after trimming.
 */
export function buildFullRelationshipId(roomId: UUID, userId: UUID): UUID {
    // Trim the inputs
    const trimmedRoomId = roomId.trim();
    const trimmedUserId = userId.trim();

    /**
     * Validate that `roomId` is a non-empty string after trimming.
     */
    if (!trimmedRoomId) {
        throw new Error("The 'roomId' parameter must be a non-empty string after trimming.");
    }

    /**
     * Validate that `userId` is a non-empty string after trimming.
     */
    if (!trimmedUserId) {
        throw new Error("The 'userId' parameter must be a non-empty string after trimming.");
    }

    /**
     * Ensure that `roomId` and `userId` are not the same.
     */
    if (trimmedRoomId === trimmedUserId) {
        throw new Error("The 'roomId' and 'userId' parameters must not have the same value.");
    }

    /**
     * Construct the full relationship ID in the format: `<trimmedRoomId>::<trimmedUserId>`.
     */
    const fullRelationshipId = `${trimmedRoomId}::${trimmedUserId}`;

    return fullRelationshipId as UUID;
}

/**
 * Given a room ID, a user ID, and a character name (from an agent)
 *  build the pair of IDs necessary to uniquely identify the
 *  relationship within the given room.
 *
 * @param roomId - The ID of the room the relationship exists in.
 * @param userId - The ID of the user that is bound to the agent/character.
 * @param characterName - The name of the character as found in the character
 *  JSON file the agent was initialized with.
 *
 * @returns - Returns a UUID built from the given parameters.
 */
export function buildRelationshipIdPair(roomId: UUID, userId: UUID, characterName: string): FullUserIdCharacterIdPair {
    // Let the builder functions validate the input parameters.
    const retObj: FullUserIdCharacterIdPair = {
        fullUserId: buildFullRelationshipId(roomId, userId),
        fullCharacterId: buildFullRelationshipId(roomId,  buildFullRelationshipId(roomId, buildCharacterNameForRelationship(characterName) as UUID))
    }

    return retObj;
}

/**
 * Given a room, a user, and the current agent/character registry containing
 *  the agent initialized for the system, remove any "relationship" records
 *  between the current user and any of the agent/characters in the registry
 *  belonging to the specified room.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the current user.
 * @param agentRegistry - An array of IAgentRuntime objects that contains
 *  all the agent/character objects that were instantiated when the
 *  system was launched.
 *
 * @returns - Returns TRUE if the operation succeeded, FALSE if there
 *  was an error during the operation.  Note, if no existing
 *  relationships existed then TRUE will still be returned because
 *  the operation is still considered successful.
 */
export async function removeAllUserToCharacterRelationships(roomId: UUID, userId: UUID, agentRegistry: IAgentRuntime[]): Promise<boolean> {

        for (let agentNdx = 0; agentNdx < agentRegistry.length; agentNdx++) {
            const agentObj = agentRegistry[agentNdx];

            const relationshipIdPair: FullUserIdCharacterIdPair =
                buildRelationshipIdPair(roomId, userId, agentObj.character.name);

            try {
                const bSuccess =
                    await agentObj.databaseAdapter.removeRelationship(
                        {
                            userA: relationshipIdPair.fullUserId,
                            userB: relationshipIdPair.fullCharacterId
                        });

                if (!bSuccess) {
                    // Relationship most likely does not exist.  Log the incident at
                    //  DEBUG level but continue on so we remove all relevant relationships.
                    elizaLogger.debug(`Relationship removal failed for user ID, character ID: ${relationshipIdPair.fullUserId} / ${relationshipIdPair.fullCharacterId}.  Most likely cause, no relationship existed.`);
                }
            } catch (error) {
                // Relationship most likely does not exist.  Log the incident at
                //  DEBUG level but continue on so we remove all relevant relationships.
                elizaLogger.debug(`CATCH BLOCK - No relationship removed for user ID, character ID: ${relationshipIdPair.fullUserId} / ${relationshipIdPair.fullCharacterId}.  Error details:`, error);
            }
        }

        return true;
}

/**
 * Creates a relationship record that binds the given user ID to the
 *  character name for the character assigned to the agent object,
 *  specific to the given room ID.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the current user.
 * @param desiredAgent - A valid agent object.
 */
export async function setUserToCharacterRelationship(roomId: UUID, userId: UUID, desiredAgent: IAgentRuntime): Promise<boolean> {

    try {
        const fullUserToCharacterIdPair =
            buildRelationshipIdPair(roomId, userId, desiredAgent.character.name);

        // Create a relationship between the user and the selected character.
        //  runtime.databaseAdapter.createRelationship().  ALWAYS put
        // the user before the character!
        desiredAgent.databaseAdapter.createRelationship(
            {
                userA: fullUserToCharacterIdPair.fullUserId,
                userB: fullUserToCharacterIdPair.fullCharacterId
            }
        );
    } catch (error) {
        // This is a serious error that will impact system operations.
        elizaLogger.error(`The attempt to create a relationship using the following parameters FAILED:\nroomId: ${roomId}\nuserId: ${userId}\nAgent/character name: ${desiredAgent?.character?.name}\nError details:\n`, error);

        return false;
    }

    return true;
}

/**
 * Creates an EXCLUSIVE relationship record that binds the given user ID to the
 *  character name for the character assigned to the agent object,
 *  specific to the given room ID, while removing all and any other relationships
 *  the user has to anyone else in the specified room.
 *
 *  @param roomId - The ID of the current room.
 *  @param userId - The ID of the current user.
 *  @param desiredAgent - The agent/character that should be only one
 *   assigned to the user.
 *
 *  @returns - Returns TRUE if the operation succeeded, FALSE if not or
 *   an error occurred.
 */
export async function setExclusiveUserToCharacterRelationship(
        roomId: UUID,
        userId: UUID,
        desiredAgent: IAgentRuntime): Promise<boolean> {

    try {
        const fullUserToCharacterIdPair =
            buildRelationshipIdPair(roomId, userId, desiredAgent.character.name);

        // Remove ALL relationships the user has to any agents in the given room.
        await desiredAgent.databaseAdapter.removeAllRelationships(
            {
                userA: fullUserToCharacterIdPair.fullUserId});

        // Create a relationship between the user and the selected character.
        //  runtime.databaseAdapter.createRelationship().  ALWAYS put
        // the user before the character!
        await desiredAgent.databaseAdapter.createRelationship(
            {
                userA: fullUserToCharacterIdPair.fullUserId,
                userB: fullUserToCharacterIdPair.fullCharacterId
            }
        );

        elizaLogger.debug(`RELATIONSHIP CREATED: Room Id(${roomId}), User Id(${userId}), Character name: ${desiredAgent.character.name}`);
    } catch (error) {
        // This is a serious error that will impact system operations.
        elizaLogger.error(`The attempt to create a relationship using the following parameters FAILED:\nroomId: ${roomId}\nuserId: ${userId}\nAgent/character name: ${desiredAgent?.character?.name}\nError details:\n`, error);

        return false;
    }

    return true;
}

// -------------------------- END  : RELATIONSHIPS ------------------------
