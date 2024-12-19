import { IAgentRuntime, type Relationship, type UUID } from "./types.ts";

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
export function buildFullRelationshipId(roomId: string, userId: string): string {
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
    return fullRelationshipId;
}

// -------------------------- END  : RELATIONSHIPS ------------------------
