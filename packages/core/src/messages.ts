import {
    IAgentRuntime,
    type Actor,
    type Content,
    type Memory,
    type UUID,
} from "./types.ts";

/**
 * String to add to the messages history to demarcate the beginning
 *  of a new session with the user.  The definition of a session
 *  is application dependent.  (e.g. - a new take-out order, etc.).
 */
export const NEW_SESSION_MESSAGE_AS_DELIMITER = '----------------------------'

/**
 * Get details for a list of actors.
 */
export async function getActorDetails({
    runtime,
    roomId,
}: {
    runtime: IAgentRuntime;
    roomId: UUID;
}) {
    const participantIds =
        await runtime.databaseAdapter.getParticipantsForRoom(roomId);
    const actors = await Promise.all(
        participantIds.map(async (userId) => {
            const account =
                await runtime.databaseAdapter.getAccountById(userId);
            if (account) {
                return {
                    id: account.id,
                    name: account.name,
                    username: account.username,
                    details: account.details,
                };
            }
            return null;
        })
    );

    return actors.filter((actor): actor is Actor => actor !== null);
}

/**
 * Format actors into a string
 * @param actors - list of actors
 * @returns string
 */
export function formatActors({ actors }: { actors: Actor[] }) {
    const actorStrings = actors.map((actor: Actor) => {
        const header = `${actor.name}${actor.details?.tagline ? ": " + actor.details?.tagline : ""}${actor.details?.summary ? "\n" + actor.details?.summary : ""}`;
        return header;
    });
    const finalActorStrings = actorStrings.join("\n");
    return finalActorStrings;
}

/**
 * Extract the relevant content from a Memory, using an actors
 *  array to get related details.
 *
 * @param message - The message to extract content from.
 * @param actors - The actors array.
 *
 * @returns - Returns a formatted string with the relevant message
 *  details.
 */
function extractMessageContent(message: Memory, actors: Actor[]) {
    const messageContent = (message.content as Content).text;
    const messageAction = (message.content as Content).action;
    const formattedName =
        actors.find((actor: Actor) => actor.id === message.userId)
            ?.name || "Unknown User";

    const attachments = (message.content as Content).attachments;

    const attachmentString =
        attachments && attachments.length > 0
            ? ` (Attachments: ${attachments.map((media) => `[${media.id} - ${media.title} (${media.url})]`).join(", ")})`
            : "";

    const timestamp = formatTimestamp(message.createdAt);

    const shortId = message.userId.slice(-5);

    return `(${timestamp}) [${shortId}] ${formattedName}: ${messageContent}${attachmentString}${messageAction && messageAction !== "null" ? ` (${messageAction})` : ""}`;
}

/**
 * Format messages into a string
 *
 * @param messages - list of messages
 * @param actors - list of actors
 *
 * @returns string - Returns all the relevant messages in newest first
 *  with each memory being turned into a formatted message and each formatted
 *  message delimited by a line feed.
 */
export const formatMessages = ({
    messages,
    actors,
}: {
    messages: Memory[];
    actors: Actor[];
}) => {
    const messageStrings = messages
        // Reverse the messages array so that it is newest first.
        .reverse()
        // Only accept messages that have a user ID.
        .filter((message: Memory) => message.userId)
        // Assemble the fields each message into formatted string with
        //  each formatted string delimited by a line feed.
        .map((message: Memory) => {
            return extractMessageContent(message, actors);
        })
        .join("\n");
    return messageStrings;
};

/**
 * This function checks to see if any of the strings contained in stopAtStrings
 *  is found in a target string.
 *
 * @param stopAtStrings - The array of strings to look for in mainText.
 * @param mainText - The target string to check for containment of any of the
 *  strings in stopAtStrings.
 * @param bCaseSensitive - If TRUE, then the contains check will be case
 *  sensitive, if FALSE, then not.
 *
 * @returns - Returns TRUE if any string in stopAtStrings is found in
 *  stopAtStrings, otherwise, FALSE is returned.
 */
function containsAnySubstring(
    stopAtStrings: string[],
    mainText: string,
    bCaseSensitive: boolean = false
): boolean {
    const errPrefix = `(containsAnySubstring) `;

    if (stopAtStrings.length < 1) {
        throw new Error(`${errPrefix}The stopAtStrings array parameter is empty.`);
    }

    if (!bCaseSensitive) {
        // Normalize both mainText and stopAtStrings to lowercase for case-insensitive comparison
        const normalizedMainText = mainText.toLowerCase();
        return stopAtStrings.some(substring => normalizedMainText.includes(substring.toLowerCase()));
    } else {
        // Perform case-sensitive comparison
        return stopAtStrings.some(substring => mainText.includes(substring));
    }
}

/**
 * Format messages into a string
 *
 * @param messages - list of messages
 * @param actors - list of actors
 * @param stopAtString - The message collection operation will
 *  halt when a message that CONTAINS any of the strings is encountered, with
 *  that message included in the output.  Otherwise, all messages
 *  will be returned that meet the selection criteria.
 *
 * @returns string - Returns all the relevant messages in newest first
 *  with each memory being turned into a formatted message and each formatted
 *  message delimited by a line feed.
 */
export const formatMessagesWithStopAtStrings = ({
                                   messages,
                                   actors,
                                   stopAtStrings
                               }: {
    messages: Memory[];
    actors: Actor[];
    stopAtStrings: string[];
}) => {
    const errPrefix = `(formatMessagesWithStopAtStrings) `;

    if (stopAtStrings.length < 1) {
        throw new Error(`${errPrefix}The stopAtStrings array is empty.`);
    }

    const reversedAndFiltered =
        // Reverse the messages array so that it is newest first.
        messages.reverse()
        // Only accept messages that have a user ID.
        .filter((message: Memory) => message.userId);

    const selectedMessages = [];
    for (let i = 0; i < reversedAndFiltered.length; i++) {
        const message = reversedAndFiltered[i];

        // Push the formatted message content.
        selectedMessages.push(extractMessageContent(message, actors));

        // Time to stop?
        const mainText = (message.content as Content).text;

        if (containsAnySubstring(stopAtStrings, mainText)) {
            break; // We're done.
        }
    }

    const messageStrings = selectedMessages.join('\n');
    return messageStrings;
};

export const formatTimestamp = (messageDate: number) => {
    const now = new Date();
    const diff = now.getTime() - messageDate;

    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (absDiff < 60000) {
        return "just now";
    } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
        return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
};
