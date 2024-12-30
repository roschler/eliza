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
                            userB: relationshipIdPair.fullCharacterId,
                            roomId: roomId
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


// -------------------------- END  : RELATIONSHIPS ------------------------
