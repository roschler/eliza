// Some types we use throughout our plugin.

export type BooleanOrNull = boolean | null;
export type NumberOrNull = number | null;
export type StringOrNull = string | null;

// -------------------------- BEGIN: HELPER FUNCTIONS ------------------------



/**
 * Extracts the character name from a formatted string.
 *
 * The function looks for a string that:
 * - Starts with "PickLicense"
 * - Contains "SELECT_CHARACTER_" followed by the character name
 * - Ends with ")"
 *
 * If the pattern matches, it returns the character name in lowercase.
 * Otherwise, it returns null.
 *
 * @param str - The input string to extract the character name from.
 * @returns The extracted character name in lowercase, or null if no match is found.
 */
function extractSelectCharacterName(str: string): StringOrNull {
    // Define a regular expression with the following components:
    // ^PickLicense           => Ensures the string starts with "PickLicense"
    // .*?                    => Non-greedy match for any characters in between
    // \(SELECT_CHARACTER_    => Matches "(SELECT_CHARACTER_"
    // ([A-Z]+)               => Captures one or more uppercase letters as the character name
    // \)                     => Matches the closing parenthesis ")"
    // $                      => Ensures the string ends here
    const regex = /^PickLicense.*\(SELECT_CHARACTER_([A-Z]+)\)$/;

    // Execute the regex on the input string
    const match = str.match(regex);

    // If a match is found, return the captured group in lowercase
    if (match && match[1]) {
        return match[1].toLowerCase();
    }

    // If no match is found, return null
    return null;
}

// -------------------------- END  : HELPER FUNCTIONS ------------------------

// -------------------------- BEGIN: CLASS, ActorActionDetails ------------------------

/**
 * Type representing an object with actor action details or null.
 */
type ActorActionDetailsOrNull = ActorActionDetails | null;

/**
 * Class representing the details of an actor's action.
 */
export class ActorActionDetails {
    public refCode: string;
    public actorName: string;
    public targetCharacterName: string;
    public sentenceFound: string;
    public actionName: string;

    /**
     * Constructs an instance of ActorActionDetails.
     *
     * @param refCode - Reference code extracted from the input string.
     * @param actorName - Name of the actor.
     * @param sentenceFound - The sentence associated with the actor's action.
     * @param actionName - Name of the action performed by the actor.
     */
    constructor(refCode: string, actorName: string, sentenceFound: string, actionName: string) {
        this.refCode = refCode;
        this.actorName = actorName;
        this.sentenceFound = sentenceFound;
        this.actionName = actionName;

        // Get the target actor name from the action name and then
        //  lowercase and trim it.
        this.targetCharacterName = extractSelectCharacterName(this.actionName) ?? "";

        this.targetCharacterName = this.targetCharacterName.trim().toLowerCase();
    }

    /**
     * Extracts the details of the most recent actor action from a formatted string.
     *
     * The method searches for the last occurrence of a string that matches the following pattern:
     * (just now) [refCode] actorName: sentenceFound (actionName)
     *
     * If a valid match is found and all captured fields are non-empty, it returns an instance of ActorActionDetails.
     * Otherwise, it returns null after logging appropriate warnings.
     *
     * @param str - The input string to extract actor action details from.
     * @returns An instance of ActorActionDetails if extraction is successful and all fields are non-empty; otherwise, null.
     */
    public static extractRecentActorAction(str: string): ActorActionDetailsOrNull {
        /**
         * Regular Expression Breakdown:
         * ^\(just now\)          => Asserts that the line starts with "(just now)"
         * \s*                     => Matches any whitespace characters (including none)
         * \[([^\]]+)\]            => Captures one or more characters that are not ']' inside square brackets as refCode
         * \s+                     => Matches one or more whitespace characters
         * ([^:]+):                => Captures one or more characters that are not ':' as actorName, followed by a colon
         * \s+                     => Matches one or more whitespace characters
         * (.*?)                   => Captures any characters (non-greedy) as sentenceFound
         * \s*                     => Matches any whitespace characters (including none)
         * \(([^)]+)\)             => Captures one or more characters that are not ')' inside parentheses as actionName
         * \s*$                    => Allows for trailing whitespace and asserts the end of the line
         *
         * Flags:
         * g - Global search to find all matches
         * m - Multiline mode to allow ^ and $ to match the start and end of each line
         */
        const regex = /^\(just now\)\s*\[([^\]]+)\]\s+([^:]+):\s+(.*?)\s*\(([^)]+)\)\s*$/gm;

        let match: RegExpExecArray | null;
        let lastMatch: RegExpExecArray | null = null;

        // Iterate through all matches to find the last one
        while ((match = regex.exec(str)) !== null) {
            lastMatch = match;
        }

        // If no match is found, return null
        if (!lastMatch) {
            return null;
        }

        // Destructure capture groups from the last match
        const [, refCode, actorName, sentenceFound, actionName] = lastMatch;

        // Trim captured values to remove any leading/trailing whitespace
        const trimmedRefCode = refCode.trim();
        const trimmedActorName = actorName.trim();
        const trimmedSentenceFound = sentenceFound.trim();
        const trimmedActionName = actionName.trim();

        // Prepare an array to keep track of empty fields
        const emptyFields: string[] = [];

        // Check each field for emptiness
        if (trimmedRefCode === '') emptyFields.push('refCode');
        if (trimmedActorName === '') emptyFields.push('actorName');
        if (trimmedSentenceFound === '') emptyFields.push('sentenceFound');
        if (trimmedActionName === '') emptyFields.push('actionName');

        // If any fields are empty, log a warning and return null
        if (emptyFields.length > 0) {
            console.warn(`Empty fields detected: ${emptyFields.join(', ')}`);
            return null;
        }

        // All fields are non-empty; create and return the ActorActionDetails object
        const actorActionDetails = new ActorActionDetails(
            trimmedRefCode,
            trimmedActorName,
            trimmedSentenceFound,
            trimmedActionName
        );

        return actorActionDetails;
    }

    public static extractRecentSelectCharacterName(str: string) : StringOrNull {
        const actorActorDetailsObj =
            this.extractRecentActorAction(str);

        if (actorActorDetailsObj)
            // Return the target character's name found in the select
            //  character action.
            return actorActorDetailsObj.
    }
}

// -------------------------- END  : CLASS, ActorActionDetails ------------------------
